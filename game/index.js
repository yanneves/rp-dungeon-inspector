import {keyBy, snakeCase} from 'lodash'
import {Phaser} from 'phaser'

import * as GAME from './settings/game'

import {Title} from './states/title'
import {Dungeon} from './states/dungeon'
import {Ending} from './states/ending'

import hazards from './data/hazards.json!'

export class Game {

  constructor() {
    // build game instance
    this.game = new Phaser.Game(
      GAME.RESOLUTION_WIDTH,
      GAME.RESOLUTION_HEIGHT,
      Phaser.AUTO,
      'game',
      { create: this.create.bind(this) }
    )
  }

  create() {
    // create game data
    this.game.data = {}
    this.game.data.hazards = keyBy(hazards, hazard => snakeCase(hazard.name))

    this.game.state.add('title', Title)
    this.game.state.add('dungeon', Dungeon)

    for (let key in this.game.data.hazards) {
      if (key !== 'torch_2') {
        let hazard = this.game.data.hazards[key]
        this.game.state.add(key, () => new Ending(this.game, key, snakeCase(hazard.next)))
      }
    }

    this.game.state.start('title')
  }

}

export default new Game()
