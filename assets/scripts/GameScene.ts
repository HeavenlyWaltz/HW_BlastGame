import { GameController, GameEvents } from './controllers/GameController';
import { InputController }            from './controllers/InputController';
import { BoardView }                  from './view/BoardView';
import { UIView }                     from './view/UIView';
import { Vec2 }                       from './core/Board';
import { GameConfig }                 from './config/GameConfig';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameScene extends cc.Component implements GameEvents {
  @property(BoardView)
  boardView: BoardView = null;

  @property(UIView)
  uiView: UIView = null;

  @property(InputController)
  inputController: InputController = null;

  @property(cc.Node)
  bombBtn: cc.Node = null;

  // @property(cc.Node)
  // teleportBtn: cc.Node = null;

  @property(cc.Node)
  restartBtn: cc.Node = null;
  
    @property(cc.Node)
  restartBtnLose: cc.Node = null;

  private gameController: GameController;

  onLoad(): void {
    this.gameController = new GameController(this);

    this.boardView.init(this.gameController.getBoard());
    this.uiView.init(
      GameConfig.goal.score,
      GameConfig.goal.moves,
      GameConfig.maxShuffles,
    );
    this.inputController.init(this.boardView, this.gameController);

    if (this.bombBtn)
      this.bombBtn.on('click', () => this.gameController.activateBomb(), this);
    // if (this.teleportBtn)
      // this.teleportBtn.on('click', () => this.gameController.activateTeleport(), this);
    if (this.restartBtn)
      this.restartBtn.on('click', () => cc.director.loadScene('Game'), this);    
	if (this.restartBtnLose)
      this.restartBtnLose.on('click', () => cc.director.loadScene('Game'), this);
  }

  async onTilesBurned(positions: Vec2[]): Promise<void> {
    await this.boardView.burnTiles(positions);
  }

  async onTilesMoved(moves: Array<{ from: Vec2; to: Vec2 }>): Promise<void> {
    await this.boardView.moveTiles(moves);
  }

  async onTilesSpawned(positions: Vec2[]): Promise<void> {
    await this.boardView.spawnTiles(positions, this.gameController.getBoard());
  }

  onScoreChanged(score: number, _earned: number): void {
    this.uiView.updateScore(score);
  }

  onMovesChanged(movesLeft: number): void {
    this.uiView.updateMoves(movesLeft);
  }

  onWin(): void {
    this.uiView.showWin();
  }

  onLose(): void {
    this.uiView.showLose();
  }

  onShuffle(shufflesLeft: number): void {
    this.uiView.showShuffleToast(shufflesLeft);
    this.uiView.updateShuffles(shufflesLeft);
    this.boardView.init(this.gameController.getBoard());
  }

  onBoosterStateChanged(type: 'bomb' | 'teleport', active: boolean): void {
    this.uiView.setBoosterActive(type, active);
  }

  onTeleportFirstSelected(pos: Vec2): void {
    this.boardView.highlightTile(pos.row, pos.col);
  }
}
