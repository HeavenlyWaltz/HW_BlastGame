export enum GameState {
  Playing = 'playing',
  Win     = 'win',
  Lose    = 'lose',
}

export class GameModel {
  state: GameState = GameState.Playing;
  movesLeft: number;
  scoreGoal: number;
  shufflesLeft: number;

  constructor(moves: number, scoreGoal: number, maxShuffles: number) {
    this.movesLeft   = moves;
    this.scoreGoal   = scoreGoal;
    this.shufflesLeft = maxShuffles;
  }

  spendMove(): void {
    if (this.movesLeft > 0) this.movesLeft--;
  }

  /** Возвращает false если перемешиваний больше нет */
  spendShuffle(): boolean {
    if (this.shufflesLeft <= 0) return false;
    this.shufflesLeft--;
    return true;
  }
}
