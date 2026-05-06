export class ScoreSystem {
  private _score = 0;

  get score(): number {
    return this._score;
  }

  /** size² * multiplier — выгоднее бить большие группы */
  addGroupScore(groupSize: number, multiplier: number): number {
    const earned = groupSize * groupSize * multiplier;
    this._score += earned;
    return earned;
  }

  reset(): void {
    this._score = 0;
  }
}
