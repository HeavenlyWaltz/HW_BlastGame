import { Board, Vec2 } from '../core/Board';
import { IBooster } from './IBooster';

export class BombBooster implements IBooster {
  isActive = false;

  constructor(private radius: number) {}

  activate(): void   { this.isActive = true;  }
  deactivate(): void { this.isActive = false; }

  apply(board: Board, row: number, col: number): Vec2[] {
    const result: Vec2[] = [];
    for (let r = row - this.radius; r <= row + this.radius; r++) {
      for (let c = col - this.radius; c <= col + this.radius; c++) {
        if (board.inBounds(r, c) && board.getTile(r, c) !== null) {
          result.push({ row: r, col: c });
        }
      }
    }
    return result;
  }
}
