import {Phaser} from 'phaser'

import {RESOLUTION_WIDTH, RESOLUTION_HEIGHT} from '../settings/game'

export class Ending {

  constructor(game, identifier, nextState) {
    this.game = game
    this.identifier = identifier
    this.nextState = nextState
  }

  preload() {
    let states = ['good', 'bad']
    states.forEach(state => {
      this.game.load.image(`${this.identifier}_${state}`, `assets/hazards/${this.identifier}_${state}_outcome.png`)
    })
  }

  create() {
    let data = this.game.data.hazards[this.identifier]

    let image = this.game.add.image(0, 0, `${this.identifier}_${data.state}`)
    image.x = (RESOLUTION_WIDTH / 2) - (image.width / 2)

    let text = this.game.add.text(
      RESOLUTION_WIDTH / 2,
      RESOLUTION_HEIGHT - (RESOLUTION_HEIGHT / 6),
      data[`${data.state}Outcome`],
      {
        wordWrap: true,
        wordWrapWidth: (RESOLUTION_WIDTH / 3) * 2,
        backgroundColor: 'rgba(255, 255, 255, 0.33)'
      }
    )
    text.anchor.setTo(0.5, 0.5)

    window.setTimeout(() => {
      this.game.state.start(data.state === 'good' ? this.nextState : 'title')
    }, 8000)
  }

  update() {

  }

}
