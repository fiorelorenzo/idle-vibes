import type { VibeHook, VibeStateName, VibeContext } from '@idle-vibes/shared'
import { VibeEngine } from './vibe-engine'

/**
 * Vibe Event Hooks — Extension Point 3
 *
 * Custom events triggered at Vibe State transitions. Community-built
 * extensions can register hooks to react to Vibe changes.
 *
 * Example: change VS Code color theme on Flow State entry.
 *
 * ```ts
 * registerVibeHook(vibeEngine, {
 *   id: 'theme-switcher',
 *   on: 'enter',
 *   state: 'flow_state',
 *   handler: () => vscode.workspace.getConfiguration('workbench')
 *     .update('colorTheme', 'One Dark Pro')
 * })
 * ```
 */
export function registerVibeHook(engine: VibeEngine, hook: VibeHook): void {
  engine.registerHook(hook)
}

/**
 * Create a simple vibe hook from a partial definition.
 */
export function createVibeHook(
  id: string,
  on: VibeHook['on'],
  state: VibeStateName | '*',
  handler: (ctx: VibeContext) => void | Promise<void>,
): VibeHook {
  return { id, on, state, handler }
}
