import { BoardView } from '../view/BoardView';
import { GameController } from './GameController';

const { ccclass, property } = cc._decorator;

@ccclass
export class InputController extends cc.Component {
  @property(cc.Node)
  boardNode: cc.Node = null;

  private boardView: BoardView;
  private gameController: GameController;

  init(boardView: BoardView, gameController: GameController): void {
    this.boardView      = boardView;
    this.gameController = gameController;
    this.boardNode.on(cc.Node.EventType.TOUCH_END, this.onTouch, this);
  }

  private onTouch(event: cc.Event.EventTouch): void {
    const localPos = this.boardView.node.convertToNodeSpaceAR(event.getLocation());
    const step = this.boardView.tileSize + this.boardView.tileGap;
    
    // Учитываем что тайлы начинаются со смещением tileSize/2
    const offset = this.boardView.tileSize / 2;
    const col = Math.floor((localPos.x - offset + step / 2) / step);
    const row = Math.floor((-localPos.y - offset + step / 2) / step);
    
    this.gameController.onTileClick(row, col);
  }

  onDestroy(): void {
    this.boardNode.off(cc.Node.EventType.TOUCH_END, this.onTouch, this);
  }
}
