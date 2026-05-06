export enum TileType {
  Normal    = 'normal',
  SuperRow  = 'super_row',
  SuperCol  = 'super_col',
  SuperBomb = 'super_bomb',
  SuperAll  = 'super_all',
}

export class Tile {
  constructor(
    public color: number,
    public type: TileType = TileType.Normal,
  ) {}

  isSuper(): boolean {
    return this.type !== TileType.Normal;
  }

  clone(): Tile {
    return new Tile(this.color, this.type);
  }
}
