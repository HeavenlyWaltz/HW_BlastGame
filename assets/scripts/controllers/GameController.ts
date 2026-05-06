import { Board, Vec2 } from '../core/Board';
import { GameModel, GameState } from '../core/GameModel';
import { GroupFinder } from '../core/GroupFinder';
import { ScoreSystem } from '../core/ScoreSystem';
import { RandomBoardFiller } from '../core/RandomBoardFiller';
import { Tile, TileType } from '../core/Tile';
import { BombBooster } from '../boosters/BombBooster';
import { TeleportBooster } from '../boosters/TeleportBooster';
import { GameConfig } from '../config/GameConfig';

export interface GameEvents {
  onTilesBurned(positions: Vec2[]): Promise<void>;
  onTilesMoved(moves: Array<{ from: Vec2; to: Vec2 }>): Promise<void>;
  onTilesSpawned(positions: Vec2[]): Promise<void>;
  onScoreChanged(score: number, earned: number): void;
  onMovesChanged(movesLeft: number): void;
  onWin(): void;
  onLose(): void;
  onShuffle(shufflesLeft: number): void;
  onBoosterStateChanged(type: 'bomb' | 'teleport', active: boolean): void;
  onTeleportFirstSelected(pos: Vec2): void;
}

export class GameController {
  private board: Board;
  private model: GameModel;
  private groupFinder: GroupFinder;
  private scoreSystem: ScoreSystem;
  private filler: RandomBoardFiller;
  private bombBooster: BombBooster;
  private teleportBooster: TeleportBooster;
  private events: GameEvents;
  private isAnimating = false;

  constructor(events: GameEvents) {
    this.events          = events;
    this.groupFinder     = new GroupFinder();
    this.scoreSystem     = new ScoreSystem();
    this.filler          = new RandomBoardFiller(GameConfig.colors);
    this.bombBooster     = new BombBooster(GameConfig.bombRadius);
    this.teleportBooster = new TeleportBooster();

    this.board = new Board(GameConfig.rows, GameConfig.cols);
    this.model = new GameModel(
      GameConfig.goal.moves,
      GameConfig.goal.score,
      GameConfig.maxShuffles,
    );

    this.board.fillEmpty(this.filler);
    this.checkAndShuffle();
  }

  getBoard(): Board       { return this.board; }
  getModel(): GameModel   { return this.model; }
  getScore(): number      { return this.scoreSystem.score; }

  activateBomb(): void {
    if (this.isAnimating) return;
    this.teleportBooster.deactivate();
    const next = !this.bombBooster.isActive;
    next ? this.bombBooster.activate() : this.bombBooster.deactivate();
    this.events.onBoosterStateChanged('bomb',     this.bombBooster.isActive);
    this.events.onBoosterStateChanged('teleport', false);
  }

  activateTeleport(): void {
    if (this.isAnimating) return;
    this.bombBooster.deactivate();
    const next = !this.teleportBooster.isActive;
    next ? this.teleportBooster.activate() : this.teleportBooster.deactivate();
    this.events.onBoosterStateChanged('teleport', this.teleportBooster.isActive);
    this.events.onBoosterStateChanged('bomb',     false);
  }

  onTileClick(row: number, col: number): void {
    if (this.isAnimating)                       return;
    if (this.model.state !== GameState.Playing) return;
    const tile = this.board.getTile(row, col);
    if (!tile) return;

    if (this.bombBooster.isActive) {
      this.applyBoosterAndProcess(this.bombBooster, row, col);
      return;
    }
    if (this.teleportBooster.isActive) {
      this.applyTeleport(row, col);
      return;
    }
    this.processNormalClick(row, col);
  }

  private async processNormalClick(row: number, col: number): Promise<void> {
    const tile = this.board.getTile(row, col)!;

    if (tile.isSuper()) {
      const positions = this.getSuperTilePositions(tile.type, row, col);
      await this.burnAndRefill(positions);
      return;
    }

    const group = this.groupFinder.findGroup(this.board, row, col);
    if (group.length < GameConfig.minGroupSize) return;

    await this.burnAndRefill(group);
  }

  private async applyBoosterAndProcess(booster: BombBooster, row: number, col: number): Promise<void> {
    const positions = booster.apply(this.board, row, col)
      .filter(p => this.board.getTile(p.row, p.col) !== null);
    booster.deactivate();
    this.events.onBoosterStateChanged('bomb', false);
    if (positions.length > 0) await this.burnAndRefill(positions);
  }

  private applyTeleport(row: number, col: number): void {
    const affected = this.teleportBooster.apply(this.board, row, col);
    if (affected.length === 0) {
      this.events.onTeleportFirstSelected({ row, col });
      return;
    }
    this.events.onTilesMoved([
      { from: affected[1], to: affected[0] },
      { from: affected[0], to: affected[1] },
    ]);
    this.events.onBoosterStateChanged('teleport', false);
    this.spendMoveAndCheck();
  }

  private async burnAndRefill(positions: Vec2[]): Promise<void> {
    if (positions.length === 0) return;
    this.isAnimating = true;

    // 1. Удаляем тайлы и ждём анимацию
    this.board.removeTiles(positions);
    await this.events.onTilesBurned(positions);

    // 2. Очки
    const earned = this.scoreSystem.addGroupScore(
      positions.length,
      GameConfig.scoring.multiplier,
    );
    this.events.onScoreChanged(this.scoreSystem.score, earned);

    // 3. Падение
    const moves = this.board.dropTiles();
    if (moves.length > 0) {
      await this.events.onTilesMoved(moves);
    }

    // 4. Заполнение — filler сам решает обычный или супер-тайл
    //    супер-тайл падает сверху как обычный, никакой разницы
    const spawned = this.board.fillEmpty(this.filler);
    if (spawned.length > 0) {
      await this.events.onTilesSpawned(spawned);
    }

    this.isAnimating = false;
    this.spendMoveAndCheck();
  }

  private spendMoveAndCheck(): void {
    this.model.spendMove();
    this.events.onMovesChanged(this.model.movesLeft);

    if (this.scoreSystem.score >= this.model.scoreGoal) {
      this.model.state = GameState.Win;
      this.events.onWin();
      return;
    }
    if (this.model.movesLeft <= 0) {
      this.model.state = GameState.Lose;
      this.events.onLose();
      return;
    }
    if (!this.groupFinder.hasAnyGroup(this.board, GameConfig.minGroupSize)) {
      this.checkAndShuffle();
    }
  }

  private checkAndShuffle(): void {
    if (this.groupFinder.hasAnyGroup(this.board, GameConfig.minGroupSize)) return;
    if (!this.model.spendShuffle()) {
      this.model.state = GameState.Lose;
      this.events.onLose();
      return;
    }
    this.shuffleBoard();
    this.events.onShuffle(this.model.shufflesLeft);
    this.checkAndShuffle();
  }

  private shuffleBoard(): void {
    const tiles: (Tile | null)[] = [];
    for (let r = 0; r < this.board.rows; r++)
      for (let c = 0; c < this.board.cols; c++)
        tiles.push(this.board.getTile(r, c));

    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.board.rows; r++)
      for (let c = 0; c < this.board.cols; c++)
        this.board.setTile(r, c, tiles[idx++]);
  }

  private getSuperTilePositions(type: TileType, row: number, col: number): Vec2[] {
    switch (type) {
      case TileType.SuperRow:
        return Array.from({ length: this.board.cols }, (_, c) => ({ row, col: c }))
          .filter(p => this.board.getTile(p.row, p.col) !== null);
      case TileType.SuperCol:
        return Array.from({ length: this.board.rows }, (_, r) => ({ row: r, col }))
          .filter(p => this.board.getTile(p.row, p.col) !== null);
      case TileType.SuperBomb:
        return this.bombBooster.apply(this.board, row, col)
          .filter(p => this.board.getTile(p.row, p.col) !== null);
      case TileType.SuperAll: {
        const all: Vec2[] = [];
        for (let r = 0; r < this.board.rows; r++)
          for (let c = 0; c < this.board.cols; c++)
            if (this.board.getTile(r, c) !== null)
              all.push({ row: r, col: c });
        return all;
      }
      default: return [];
    }
  }
}