/**
 * Easing functions: (t: number) => number where t is 0..1
 */

export type EasingFn = (t: number) => number

export const easings: Record<string, EasingFn> = {
  linear: (t) => t,

  easeInOut: (t) => {
    return t < 0.5
      ? 0.5 * (1 - Math.cos(Math.PI * t))
      : 0.5 * (1 + Math.cos(Math.PI * (1 - t)))
  },

  easeOutBounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75
      return 7.5625 * t * t + 0.75
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75
      return 7.5625 * t * t + 0.9375
    } else {
      t -= 2.625 / 2.75
      return 7.5625 * t * t + 0.984375
    }
  },

  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
  },
}
