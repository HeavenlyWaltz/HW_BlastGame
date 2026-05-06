import { Tile, TileType } from './Tile';
import { IBoardFiller } from './IBoardFiller';
import { GameConfig } from '../config/GameConfig';

export class RandomBoardFiller implements IBoardFiller {
  constructor(private colorCount: number) {}

  createTile(): Tile {
    if (Math.random() < GameConfig.superTileSpawnChance) {
      const types = [
        TileType.SuperRow,
        TileType.SuperCol,
        TileType.SuperBomb,
        TileType.SuperAll,
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      // Даём супер-тайлу уникальный цвет 99 чтобы не путался с обычными
      return new Tile(99, type);
    }
    const color = Math.floor(Math.random() * this.colorCount);
    return new Tile(color);
  }
}
