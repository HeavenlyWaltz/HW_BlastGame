import { Board, Vec2 } from './Board';

export class GroupFinder {
  /** BFS — находит всю группу одного цвета от точки клика */
  findGroup(board: Board, row: number, col: number): Vec2[] {
    const tile = board.getTile(row, col);
    if (!tile) return [];

    const targetColor = tile.color;
    const visited = new Set<string>();
    const queue: Vec2[] = [{ row, col }];
    const group: Vec2[] = [];

    const key = (r: number, c: number) => `${r},${c}`;
    visited.add(key(row, col));

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      for (const neighbor of board.getNeighbors(current.row, current.col)) {
        const k = key(neighbor.row, neighbor.col);
        if (visited.has(k)) continue;
        const neighborTile = board.getTile(neighbor.row, neighbor.col);
        if (neighborTile && neighborTile.color === targetColor) {
          visited.add(k);
          queue.push(neighbor);
        }
      }
    }

    return group;
  }

  /** Проверяет: есть ли хоть одна группа >= minSize на поле */
  hasAnyGroup(board: Board, minSize: number): boolean {
    const visited = new Set<string>();
    const key = (r: number, c: number) => `${r},${c}`;

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        if (visited.has(key(row, col))) continue;
        const tile = board.getTile(row, col);
        if (!tile) continue;

        const group = this.findGroup(board, row, col);
        for (const p of group) visited.add(key(p.row, p.col));

        if (group.length >= minSize) return true;
      }
    }
    return false;
  }
}
