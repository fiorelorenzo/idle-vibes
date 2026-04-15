/**
 * Simple flat tile grid used by pathfinding and rendering alignment.
 *
 * `passable` uses 1 = walkable, 0 = blocked. The Core, crack spawn points,
 * and layer boundaries live outside this grid as world-absolute positions.
 */
export class TileGrid {
  readonly width: number
  readonly height: number
  readonly passable: Uint8Array

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.passable = new Uint8Array(width * height)
    this.passable.fill(1)
  }

  index(gx: number, gy: number): number {
    return gy * this.width + gx
  }

  isPassable(gx: number, gy: number): boolean {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false
    return this.passable[this.index(gx, gy)] === 1
  }

  setPassable(gx: number, gy: number, value: boolean): void {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return
    this.passable[this.index(gx, gy)] = value ? 1 : 0
  }
}
