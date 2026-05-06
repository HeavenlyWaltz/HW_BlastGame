import { Tile } from './Tile';
import { IBoardFiller } from './IBoardFiller';

export interface Vec2 {
  row: number;
  col: number;
}

export class Board {
  private grid: (Tile | null)[][];

  constructor(
    public readonly rows: number,
    public readonly cols: number,
  ) {
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  getTile(row: number, col: number): Tile | null {
    if (!this.inBounds(row, col)) return null;
    return this.grid[row][col];
  }

  setTile(row: number, col: number, tile: Tile | null): void {
    if (!this.inBounds(row, col)) return;
    this.grid[row][col] = tile;
  }

  removeTiles(positions: Vec2[]): void {
    for (const { row, col } of positions) {
      this.grid[row][col] = null;
    }
  }

  /** Опускает тайлы вниз. Возвращает список движений для анимации. */
  dropTiles(): Array<{ from: Vec2; to: Vec2 }> {
    const moves: Array<{ from: Vec2; to: Vec2 }> = [];
    for (let col = 0; col < this.cols; col++) {
      let empty = this.rows - 1;
      for (let row = this.rows - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          if (row !== empty) {
            moves.push({ from: { row, col }, to: { row: empty, col } });
            this.grid[empty][col] = this.grid[row][col];
            this.grid[row][col] = null;
          }
          empty--;
        }
      }
    }
    return moves;
  }

  /** Заполняет пустые ячейки новыми тайлами сверху. */
  fillEmpty(filler: IBoardFiller): Vec2[] {
    const spawned: Vec2[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === null) {
          this.grid[row][col] = filler.createTile();
          spawned.push({ row, col });
        }
      }
    }
    return spawned;
  }

  swapTiles(a: Vec2, b: Vec2): void {
    const tmp = this.grid[a.row][a.col];
    this.grid[a.row][a.col] = this.grid[b.row][b.col];
    this.grid[b.row][b.col] = tmp;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  getNeighbors(row: number, col: number): Vec2[] {
    return [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ].filter(p => this.inBounds(p.row, p.col));
  }

  clone(): Board {
    const b = new Board(this.rows, this.cols);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        b.grid[r][c] = this.grid[r][c]?.clone() ?? null;
    return b;
  }
}
