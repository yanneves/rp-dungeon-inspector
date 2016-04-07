import {Phaser} from 'phaser'

import {RESOLUTION_WIDTH, CREDITS_URL} from '../settings/game'
import * as PLAYER from '../settings/player'

export class Title {

  constructor(game) {
    this.game = game
  }

  proceedToDungeon() {
    this.game.state.start('dungeon')
  }

  openCredits() {
    window.open(CREDITS_URL)
  }

  preload() {
    // load title screen
    this.game.load.image('titlescreen', 'assets/titlescreen.png')

    // load title screen button sprites
    this.game.load.spritesheet('play', 'assets/play.button.sprite.png', (517 * .66), 154)
    this.game.load.spritesheet('credits', 'assets/credits.button.sprite.png', (517 * .66), 154)

    // load full size character sprite
    this.game.load.spritesheet('large_character', 'assets/character.large.sprite.png', 495, 495)

    // load title screen audio
    this.game.load.audio('intro_theme', 'assets/sound/holfix/9.mp3')
  }

  create() {
    // add titlescreen backdrop
    this.game.add.image(0, 0, 'titlescreen')

    // add character sprite
    this.character = this.game.add.sprite(RESOLUTION_WIDTH - 450, 175, 'large_character')

    // add character animations
    PLAYER.ANIMATIONS.forEach(({name, sequence, delay}) => {
      this.character.animations.add(name, sequence, delay, true)
    })

    // register cursor controls
    this.cursors = this.game.input.keyboard.createCursorKeys()

    // add credits button
    this.game.add.button(
      /* x: */ (RESOLUTION_WIDTH / 2) - ((517 * .66) / 2),
      /* y: */ 600 - (154 / 2),
      /* sprite: */ 'credits',
      /* callback: */ this.openCredits,
      /* callback context: */ this,
      /* overFrame: */ 1,
      /* outFrame: */ 0,
      /* downFrame: */ 2,
      /* upFrame: */ 0
    )

    // add play button
    this.game.add.button(
      /* x: */ (RESOLUTION_WIDTH / 2) - ((517 * .66) / 2),
      /* y: */ 450 - (154 / 2),
      /* sprite: */ 'play',
      /* callback: */ this.proceedToDungeon,
      /* callback context: */ this,
      /* overFrame: */ 1,
      /* outFrame: */ 0,
      /* downFrame: */ 2,
      /* upFrame: */ 0
    )

    // play intro theme
    this.game.sound.stopAll()
    this.game.sound.play('intro_theme', .5, true)
  }

  update() {
    // define active animation
    let activeAnimation = PLAYER.ANIMATION_IDLE

    // handle key bindings
    // ---

    if (this.cursors.left.isDown) {
      activeAnimation = PLAYER.ANIMATION_LEFT
    }

    if (this.cursors.right.isDown) {
      activeAnimation = PLAYER.ANIMATION_RIGHT
    }

    // apply active animation
    if (activeAnimation) {
      this.character.animations.play(activeAnimation)
    } else {
      this.character.animations.stop()
      this.character.frame = 5
    }
  }

}
