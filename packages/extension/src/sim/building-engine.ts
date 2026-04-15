import type { WorldSnapshot, GameEvent, BuildingState, BuildingKind } from '@idle-vibes/shared'
import { BUILDING_DEFS } from '@idle-vibes/shared'

/**
 * Ticks building production on a 1-second interval. Each building with
 * productionIntervalSec > 0 accrues elapsed time and fires a production
 * event on each interval.
 */
export class BuildingEngine {
  private snapshot: WorldSnapshot | null = null
  private emit: (e: GameEvent) => void = () => {}
  private timer: ReturnType<typeof setInterval> | null = null
  private timers = new Map<string, number>()

  attach(snapshot: WorldSnapshot, emit: (e: GameEvent) => void): void {
    this.snapshot = snapshot
    this.emit = emit
    this.timer = setInterval(() => this.tick(1), 1000)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.timers.clear()
  }

  /** Called after prestige / wipe so stale timers don't fire on fresh buildings. */
  reset(): void {
    this.timers.clear()
  }

  private tick(dt: number): void {
    if (!this.snapshot) return
    for (const building of this.snapshot.buildings) {
      const def = BUILDING_DEFS.find((b) => b.id === building.kind)
      if (!def || def.productionIntervalSec <= 0) continue
      const acc = (this.timers.get(building.id) ?? 0) + dt
      if (acc >= def.productionIntervalSec) {
        this.timers.set(building.id, 0)
        this.produce(building)
      } else {
        this.timers.set(building.id, acc)
      }
    }
  }

  private produce(building: BuildingState): void {
    if (!this.snapshot) return
    switch (building.kind) {
      case 'well':
        this.snapshot.resources.tokens += 1
        break
      case 'loom':
        this.emit({
          kind: 'kin_spawn',
          kinKind: 'scribe',
          gx: building.gx,
          gy: building.gy + 1,
          layer: building.layer,
        })
        break
      case 'barracks':
        this.emit({
          kind: 'kin_spawn',
          kinKind: 'warden',
          gx: building.gx,
          gy: building.gy + 1,
          layer: building.layer,
        })
        break
      case 'gate':
        // Passive effect handled by the effects bus (reads snapshot.buildings)
        break
    }
  }
}

export function hasBuilding(snapshot: WorldSnapshot, kind: BuildingKind): boolean {
  return snapshot.buildings.some((b) => b.kind === kind)
}

export function countBuildings(snapshot: WorldSnapshot, kind: BuildingKind): number {
  return snapshot.buildings.filter((b) => b.kind === kind).length
}
