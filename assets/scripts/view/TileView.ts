import { TileType } from '../core/Tile';

const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
  @property([cc.SpriteFrame])
  normalFrames: cc.SpriteFrame[] = [];

  @property(cc.SpriteFrame)
  superRowFrame: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  superColFrame: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  superBombFrame: cc.SpriteFrame = null;

  @property(cc.SpriteFrame)
  superAllFrame: cc.SpriteFrame = null;

  private sprite: cc.Sprite;

  onLoad(): void {
    this.sprite = this.getComponent(cc.Sprite);
  }

  setup(color: number, type: TileType): void {
    if (!this.sprite) {
      this.sprite = this.getComponent(cc.Sprite);
    }

    switch (type) {
      case TileType.SuperRow:
        this.sprite.spriteFrame = this.superRowFrame;
        break;
      case TileType.SuperCol:
        this.sprite.spriteFrame = this.superColFrame;
        break;
      case TileType.SuperBomb:
        this.sprite.spriteFrame = this.superBombFrame;
        break;
      case TileType.SuperAll:
        this.sprite.spriteFrame = this.superAllFrame;
        break;
      default:
        // Обычный тайл — берём по индексу цвета
        if (this.normalFrames[color] !== undefined) {
          this.sprite.spriteFrame = this.normalFrames[color];
        } else {
          // Запасной вариант — берём первый цвет
          this.sprite.spriteFrame = this.normalFrames[0];
        }
        break;
    }

    // Сбрасываем прозрачность и масштаб на случай если нода вернулась из пула
    this.node.opacity = 255;
    this.node.scale = 1;
  }

  animateBurn(): Promise<void> {
    return new Promise(resolve => {
      cc.tween(this.node)
        .to(0.08, { scale: 1.3 })
        .to(0.15, { scale: 0, opacity: 0 })
        .call(() => resolve())
        .start();
    });
  }

  animateSpawn(): Promise<void> {
    this.node.scale = 0;
    this.node.opacity = 255;
    return new Promise(resolve => {
      cc.tween(this.node)
        .to(0.25, { scale: 1 }, { easing: 'backOut' })
        .call(() => resolve())
        .start();
    });
  }

  animateMoveTo(targetPos: cc.Vec2): Promise<void> {
    return new Promise(resolve => {
      cc.tween(this.node)
        .to(0.18, { position: cc.v3(targetPos.x, targetPos.y, 0) }, { easing: 'sineIn' })
        .call(() => resolve())
        .start();
    });
  }

  animateHighlight(): void {
    cc.tween(this.node)
      .to(0.1, { scale: 1.2 })
      .to(0.1, { scale: 1.0 })
      .to(0.1, { scale: 1.15 })
      .to(0.1, { scale: 1.0 })
      .start();
  }

  animateReject(): void {
    cc.tween(this.node)
      .to(0.05, { scale: 0.88 })
      .to(0.1, { scale: 1.0 })
      .start();
  }
}
