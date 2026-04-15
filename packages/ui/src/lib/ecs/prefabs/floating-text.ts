import { addComponent, addEntity } from 'bitecs'
import { Container, Graphics, Text } from 'pixi.js'
import {
  Position,
  PreviousPosition,
  FloatingText,
  Renderable,
  SpriteRef,
} from '../components'
import type { EcsWorld } from '../world'

const FT_LIFE = 1.0

/**
 * A floating "+N TOK" style popup above a world position. Uses a Pixi Text
 * (DOM-free, rendered via the canvas). Life 1s, rises, fades.
 */
export function spawnFloatingText(
  world: EcsWorld,
  x: number,
  y: number,
  text: string,
  tint: number,
): number {
  const eid = addEntity(world)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, FloatingText, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = x
  Position.y[eid] = y
  PreviousPosition.x[eid] = x
  PreviousPosition.y[eid] = y
  FloatingText.glyph[eid] = 0
  FloatingText.value[eid] = 0
  FloatingText.tint[eid] = tint
  FloatingText.life[eid] = FT_LIFE
  FloatingText.maxLife[eid] = FT_LIFE
  SpriteRef.tint[eid] = tint
  SpriteRef.frame[eid] = 0

  const container = new Container()
  const label = new Text({
    text,
    style: {
      fontFamily: 'monospace',
      fontSize: 8,
      fill: tint,
      fontWeight: 'bold',
    },
  })
  label.anchor.set(0.5, 0.5)
  label.resolution = 2
  const bg = new Graphics()
  bg.rect(-label.width / 2 - 1, -label.height / 2 - 1, label.width + 2, label.height + 2)
  bg.fill({ color: 0x000000, alpha: 0.25 })
  container.addChild(bg, label)
  container.x = x
  container.y = y
  world.pixi.layers.effects.addChild(container)
  world.sprites.register(eid, container)

  return eid
}
