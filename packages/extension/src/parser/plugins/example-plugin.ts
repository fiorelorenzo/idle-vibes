import type { ParserPlugin, ParserEvent, ParserSignal } from '@idle-vibes/shared'

/**
 * Example Parser Plugin — Extension Point 1
 *
 * This file demonstrates how to add a new detection behavior to the
 * Smart Parser without modifying core parser logic.
 *
 * To create a new plugin:
 * 1. Create a new file in this directory
 * 2. Implement the ParserPlugin interface
 * 3. Register it in packages/extension/src/parser/index.ts
 *
 * No other files need modification.
 */
export class ExamplePlugin implements ParserPlugin {
  readonly id = 'example-plugin'
  readonly pillar = 'A' as const
  readonly name = 'Example Plugin'

  detect(event: ParserEvent): ParserSignal | null {
    // Replace this with your detection logic.
    // Return a ParserSignal if the event matches, or null to skip.
    return null
  }
}
