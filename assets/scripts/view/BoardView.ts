import { TileView } from './TileView';
import { Vec2, Board } from '../core/Board';

const { ccclass, property } = cc._decorator;

@ccclass
export class BoardView extends cc.Component {
  @property(cc.Node)
  tileContainer: cc.Node = null;

  @property(cc.Prefab)
  tilePrefab: cc.Prefab = null;

  @property
  tileSize: number = 60;

  @property
  tileGap: number = 4;

  private tileViews: (TileView | null)[][] = [];
  private pool: cc.NodePool;

  onLoad(): void {
    this.pool = new cc.NodePool();
  }

  init(board: Board): void {
    if (!this.pool) {
      this.pool = new cc.NodePool();
    }

    // Возвращаем все ноды в пул
    for (let r = 0; r < this.tileViews.length; r++) {
      for (let c = 0; c < (this.tileViews[r]?.length ?? 0); c++) {
        const v = this.tileViews[r][c];
        if (v && v.node && v.node.isValid) {
          v.node.stopAllActions();
          this.pool.put(v.node);
        }
      }
    }

    this.tileViews = Array.from({ length: board.rows }, () =>
      Array(board.cols).fill(null)
    );

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const tile = board.getTile(r, c);
        if (tile) this.spawnTileView(r, c, tile.color, tile.type);
      }
    }
  }

  async burnTiles(positions: Vec2[]): Promise<void> {
    const anims = positions.map(({ row, col }) => {
      const view = this.tileViews[row]?.[col];
      if (!view) return Promise.resolve();
      this.tileViews[row][col] = null;
      return view.animateBurn().then(() => {
        if (view.node && view.node.isValid) {
          view.node.stopAllActions();
          this.pool.put(view.node);
        }
      });
    });
    await Promise.all(anims);
  }

  async moveTiles(moves: Array<{ from: Vec2; to: Vec2 }>): Promise<void> {
    const anims = moves.map(({ from, to }) => {
      const view = this.tileViews[from.row]?.[from.col];
      if (!view) return Promise.resolve();
      this.tileViews[to.row][to.col] = view;
      this.tileViews[from.row][from.col] = null;
      return view.animateMoveTo(this.getNodePos(to.row, to.col));
    });
    await Promise.all(anims);
  }

  async spawnTiles(positions: Vec2[], board: Board): Promise<void> {
    const anims = positions.map(({ row, col }) => {
      const tile = board.getTile(row, col);
      if (!tile) return Promise.resolve();
      if (this.tileViews[row][col]) return Promise.resolve();

      const view = this.spawnTileView(row, col, tile.color, tile.type);
      // Стартуем выше поля
      const startY = this.getNodePos(0, col).y + (this.tileSize + this.tileGap) * 2;
      view.node.setPosition(cc.v3(this.getNodePos(row, col).x, startY, 0));
      view.node.opacity = 255;
      view.node.scale = 1;

      const targetPos = this.getNodePos(row, col);
      return view.animateMoveTo(targetPos);
    });
    await Promise.all(anims);
  }

  highlightTile(row: number, col: number): void {
    this.tileViews[row]?.[col]?.animateHighlight();
  }

  getNodePos(row: number, col: number): cc.Vec2 {
    const step = this.tileSize + this.tileGap;
    const offsetX = this.tileSize / 2;
    const offsetY = -(this.tileSize / 2);
    return cc.v2(col * step + offsetX, -row * step + offsetY);
  }

  private spawnTileView(
    row: number,
    col: number,
    color: number,
    type: import('../core/Tile').TileType,
  ): TileView {
    let node: cc.Node;

    if (this.pool.size() > 0) {
      node = this.pool.get();
    } else {
      node = cc.instantiate(this.tilePrefab);
    }

    node.parent = this.tileContainer;
    node.stopAllActions();
    node.opacity = 255;
    node.scale = 1;
    node.setPosition(this.getNodePos(row, col));

    // Получаем компонент и вызываем setup явно
    let view = node.getComponent(TileView);
    if (!view) {
      view = node.addComponent(TileView);
    }
    // setup сам найдёт Sprite и поставит правильный спрайт
    view.setup(color, type);

    this.tileViews[row][col] = view;
    return view;
  }
}