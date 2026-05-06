import { Board, Vec2 } from '../core/Board';
import { IBooster } from './IBooster';

export class TeleportBooster implements IBooster {
  isActive = false;
  private firstTile: Vec2 | null = null;

  activate(): void   { this.isActive = true;  this.firstTile = null; }
  deactivate(): void { this.isActive = false; this.firstTile = null; }

  /**
   * Вызывается дважды:
   *   1-й клик — запоминает позицию, возвращает []
   *   2-й клик — меняет тайлы местами, возвращает [first, second]
   */
  apply(board: Board, row: number, col: number): Vec2[] {
    if (!this.firstTile) {
      this.firstTile = { row, col };
      return [];
    }

    const second = { row, col };
    board.swapTiles(this.firstTile, second);
    const result = [this.firstTile, second];
    this.firstTile = null;
    this.deactivate();
    return result;
  }
}
