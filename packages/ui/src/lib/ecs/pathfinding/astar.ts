import type { TileGrid } from './grid'

/**
 * Very small A* implementation for 4-directional grid movement.
 *
 * Scale target: tens of paths per tick max. The grid is ~20×200 (all layers
 * stacked), so node count is bounded. We allocate scratch arrays up front
 * and reuse them — zero garbage per call.
 */
export interface PathResult {
  /** Flat array of [gx0, gy0, gx1, gy1, ...]. Empty if no path. */
  nodes: number[]
  found: boolean
}

const MAX_NODES = 20 * 256
const scratchG = new Float32Array(MAX_NODES)
const scratchF = new Float32Array(MAX_NODES)
const scratchCameFrom = new Int32Array(MAX_NODES)
const scratchOpen = new Uint8Array(MAX_NODES)
const scratchClosed = new Uint8Array(MAX_NODES)
const openHeap: number[] = []

export function findPath(
  grid: TileGrid,
  sx: number,
  sy: number,
  gx: number,
  gy: number,
  out: PathResult,
): PathResult {
  out.nodes.length = 0
  out.found = false

  if (sx === gx && sy === gy) {
    out.found = true
    return out
  }
  if (!grid.isPassable(gx, gy)) return out

  const w = grid.width
  const h = grid.height
  const size = w * h
  if (size > MAX_NODES) return out

  scratchG.fill(Infinity, 0, size)
  scratchF.fill(Infinity, 0, size)
  scratchCameFrom.fill(-1, 0, size)
  scratchOpen.fill(0, 0, size)
  scratchClosed.fill(0, 0, size)
  openHeap.length = 0

  const start = sy * w + sx
  const goal = gy * w + gx
  scratchG[start] = 0
  scratchF[start] = heuristic(sx, sy, gx, gy)
  scratchOpen[start] = 1
  heapPush(openHeap, start, scratchF)

  let iterations = 0
  const maxIterations = size * 4

  while (openHeap.length > 0 && iterations++ < maxIterations) {
    const current = heapPop(openHeap, scratchF)
    if (current < 0) break
    if (current === goal) {
      reconstruct(current, start, w, out)
      out.found = true
      return out
    }
    scratchOpen[current] = 0
    scratchClosed[current] = 1

    const cx = current % w
    const cy = Math.floor(current / w)
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const nidx = ny * w + nx
      if (scratchClosed[nidx] === 1) continue
      if (!grid.isPassable(nx, ny)) continue
      const tentativeG = scratchG[current] + 1
      if (tentativeG < scratchG[nidx]) {
        scratchCameFrom[nidx] = current
        scratchG[nidx] = tentativeG
        scratchF[nidx] = tentativeG + heuristic(nx, ny, gx, gy)
        if (scratchOpen[nidx] === 0) {
          scratchOpen[nidx] = 1
          heapPush(openHeap, nidx, scratchF)
        } else {
          heapifyUp(openHeap, openHeap.indexOf(nidx), scratchF)
        }
      }
    }
  }

  return out
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

function reconstruct(goal: number, start: number, w: number, out: PathResult): void {
  const stack: number[] = []
  let cur = goal
  let safety = 0
  while (cur !== start && cur >= 0 && safety++ < 4096) {
    stack.push(cur)
    cur = scratchCameFrom[cur]
  }
  // Emit in forward order (exclude start, include goal)
  for (let i = stack.length - 1; i >= 0; i--) {
    const idx = stack[i]
    out.nodes.push(idx % w, Math.floor(idx / w))
  }
}

function heapPush(heap: number[], idx: number, scores: Float32Array): void {
  heap.push(idx)
  heapifyUp(heap, heap.length - 1, scores)
}

function heapPop(heap: number[], scores: Float32Array): number {
  if (heap.length === 0) return -1
  const top = heap[0]
  const last = heap.pop()!
  if (heap.length > 0) {
    heap[0] = last
    heapifyDown(heap, 0, scores)
  }
  return top
}

function heapifyUp(heap: number[], i: number, scores: Float32Array): void {
  while (i > 0) {
    const parent = (i - 1) >> 1
    if (scores[heap[parent]] > scores[heap[i]]) {
      const tmp = heap[parent]
      heap[parent] = heap[i]
      heap[i] = tmp
      i = parent
    } else break
  }
}

function heapifyDown(heap: number[], i: number, scores: Float32Array): void {
  const n = heap.length
  while (true) {
    const l = 2 * i + 1
    const r = 2 * i + 2
    let smallest = i
    if (l < n && scores[heap[l]] < scores[heap[smallest]]) smallest = l
    if (r < n && scores[heap[r]] < scores[heap[smallest]]) smallest = r
    if (smallest === i) break
    const tmp = heap[smallest]
    heap[smallest] = heap[i]
    heap[i] = tmp
    i = smallest
  }
}

export function createPathResult(): PathResult {
  return { nodes: [], found: false }
}
