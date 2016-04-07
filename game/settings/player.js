import {BASE_GRAVITY, BASE_ACCELERATION, BASE_MAX_VELOCITY} from './physics'

// physics
// ---

export const BOUNCE = 0.2
export const GRAVITY = BASE_GRAVITY
export const TORQUE = BASE_ACCELERATION
export const MAX_VELOCITY = BASE_MAX_VELOCITY

export const BOUNDING_BOX_X = 32
export const BOUNDING_BOX_Y = 48
export const BOUNDING_BOX_OFFSET_X = 16
export const BOUNDING_BOX_OFFSET_Y = 16

// animations
// ---

export const ANIMATION_DELAY = 12
export const ANIMATION_IDLE = 'idle'
export const ANIMATION_LEFT = 'left'
export const ANIMATION_RIGHT = 'right'
export const ANIMATIONS = [
  {
    name: 'idle',
    sequence: [5, 6, 5, 4],
    delay: ANIMATION_DELAY / 4
  },
  {
    name: 'left',
    sequence: [6, 7, 8, 9, 10, 11, 10, 9, 8, 7],
    delay: ANIMATION_DELAY
  },
  {
    name: 'right',
    sequence: [4, 3, 2, 1, 0, 1, 2, 3],
    delay: ANIMATION_DELAY
  }
]
