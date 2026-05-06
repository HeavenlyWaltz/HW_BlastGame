import { Tile } from './Tile';

export interface IBoardFiller {
  createTile(): Tile;
}
