const { ccclass, property } = cc._decorator;

@ccclass
export class UIView extends cc.Component {
  @property(cc.Label)  scoreLabel:        cc.Label = null;
  @property(cc.Label)  movesLabel:        cc.Label = null;
  @property(cc.Label)  goalLabel:         cc.Label = null;
  @property(cc.Label)  shufflesLabel:     cc.Label = null;
  @property(cc.Node)   winPanel:          cc.Node  = null;
  @property(cc.Node)   losePanel:         cc.Node  = null;
  @property(cc.Node)   shuffleToast:      cc.Node  = null;
  @property(cc.Node)   bombBtn:           cc.Node  = null;
  @property(cc.Node)   teleportBtn:       cc.Node  = null;

  init(scoreGoal: number, moves: number, shuffles: number): void {
    this.goalLabel.string     = `Цель: ${scoreGoal}`;
    this.updateScore(0);
    this.updateMoves(moves);
    this.updateShuffles(shuffles);
    this.winPanel.active      = false;
    this.losePanel.active     = false;
    if (this.shuffleToast) this.shuffleToast.active = false;
  }

  updateScore(score: number): void {
    this.scoreLabel.string = `Очки: ${score}`;
  }

  updateMoves(moves: number): void {
    this.movesLabel.string = `Ходы: ${moves}`;
  }

  updateShuffles(shuffles: number): void {
    if (this.shufflesLabel)
      this.shufflesLabel.string = `Перемешиваний: ${shuffles}`;
  }

  showWin(): void {
    this.winPanel.active = true;
    cc.tween(this.winPanel)
      .set({ scale: 0 })
      .to(0.4, { scale: 1 }, { easing: 'backOut' })
      .start();
  }

  showLose(): void {
    this.losePanel.active = true;
    cc.tween(this.losePanel)
      .set({ scale: 0 })
      .to(0.4, { scale: 1 }, { easing: 'backOut' })
      .start();
  }

  showShuffleToast(shufflesLeft: number): void {
    if (!this.shuffleToast) return;
    this.shuffleToast.active  = true;
    const label = this.shuffleToast.getComponentInChildren(cc.Label);
    if (label)
      label.string = shufflesLeft > 0
        ? `Перемешивание! Осталось: ${shufflesLeft}`
        : 'Последнее перемешивание!';

    cc.tween(this.shuffleToast)
      .set({ opacity: 255 })
      .delay(1.5)
      .to(0.4, { opacity: 0 })
      .call(() => { this.shuffleToast.active = false; })
      .start();
  }

  setBoosterActive(type: 'bomb' | 'teleport', active: boolean): void {
    const btn = type === 'bomb' ? this.bombBtn : this.teleportBtn;
    if (!btn) return;
    btn.color = active ? new cc.Color(255, 220, 50) : cc.Color.WHITE;
    cc.tween(btn)
      .to(0.1, { scale: active ? 1.15 : 1.0 })
      .start();
  }
}
