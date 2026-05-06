import { Board, Vec2 } from '../core/Board';

export interface IBooster {
  isActive: boolean;
  activate(): void;
  deactivate(): void;
  /** Возвращает список позиций для уничтожения / перестановки */
  apply(board: Board, row: number, col: number): Vec2[];
}
