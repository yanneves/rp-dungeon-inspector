import $ from 'bootstrap'
import {compile} from 'handlebars'
import {debounce, snakeCase} from 'lodash'
import {Phaser} from 'phaser'

import * as PHYSICS from '../settings/physics'
import * as PLAYER from '../settings/player'

import modalTemplate from '../data/modal.hbs.html!text'

export class Dungeon {

  constructor(game) {
    this.game = game
    this.modal = $('#modal')

    this.template = compile(modalTemplate)

    this.handleHazardInteraction = debounce(this._handleHazardInteraction, 300, { leading: true, trailing: false })
  }

  _handleHazardInteraction(hazard) {
    this.openInteraction = true

    let key = snakeCase(hazard.identifier)
    let data = this.game.data.hazards[key]
    this.modal.html(this.template({ key: key, ...data }))

    let modal = this.modal.modal('show')
    this.modal.on('hide.bs.modal', () => {
      let norm = this.modal.find('#normalImage').css('display') !== 'none'
      let good = this.modal.find('#goodImage').css('display') !== 'none'
      let bad = this.modal.find('#badImage').css('display') !== 'none'

      if (norm || bad) {
        data.state = 'bad'
      } else if (good) {
        data.state = 'good'
      }

      this.openInteraction = false
    })
  }

  proceedToEnding() {
    this.game.sound.stopAll()
    this.game.sound.play('ending', .5, true)
    this.game.state.start('table_and_chairs')
  }

  preload() {
    // load transparent texture
    this.game.load.image('transparent', 'assets/transparent.png')

    // load interaction popover
    this.game.load.image('interaction', 'assets/interaction.png')

    // load character spritesheet
    this.game.load.spritesheet('character', 'assets/character.sprite.png', 64, 64)

    // load dungeon tilemap
    this.game.load.tilemap('dungeon', 'assets/maps/dungeon.json', null, Phaser.Tilemap.TILED_JSON)

    // load tilesets
    this.game.load.image('rpgpack', 'assets/kenney/rpgpack.sprite.png')
    this.game.load.image('roguelike', 'assets/kenney/roguelike.sprite.png')

    // load title screen audio
    this.game.load.audio('ambience', 'assets/sound/ambience.wav')
    this.game.load.audio('ending', 'assets/sound/holfix/3.mp3')
  }

  create() {
    // render tilemap and tilesets
    this.map = this.game.add.tilemap('dungeon')
    this.map.addTilesetImage('Kenney RPG', 'rpgpack')
    this.map.addTilesetImage('Kenney Rogue Like Indoor', 'roguelike')

    // render tilemap layers
    this.map.layers.forEach(layer => {
      let render = this.map.createLayer(layer.name)
      render.resizeWorld()
      render.wrap = true
    })

    // setup game physics engine
    this.game.physics.startSystem(Phaser.Physics.ARCADE)

    // locate start point coordinates
    let startPointObj = this.map.objects['Game Objects'][0]
    this.startPoint = new Phaser.Point(startPointObj.x, startPointObj.y)

    // create end point collision
    let endPointObj = this.map.objects['Game Objects'][1]
    this.endPoint = this.game.add.sprite(endPointObj.x, endPointObj.y, 'transparent')
    this.endPoint.width = endPointObj.width
    this.endPoint.height = endPointObj.height
    this.game.physics.enable(this.endPoint)
    this.endPoint.body.immovable = true

    // implement interaction entity
    this.interaction = this.game.add.image(-150, -150, 'interaction')
    this.openInteraction = false

    // implement hazard collisions
    let hazardEntities = this.map.objects['Hazards'].map(hazard => {
      let entity = this.game.add.sprite(hazard.x, hazard.y, 'transparent')
      entity.width = hazard.width
      entity.height = hazard.height
      entity.identifier = hazard.name
      this.game.physics.enable(entity)
      entity.body.immovable = true
      return entity
    })

    this.hazards = this.game.add.group()
    this.hazards.enableBody = true
    this.hazards.addMultiple(hazardEntities)

    // implement wall collisions
    let wallEntities = this.map.objects['Walls Collision'].map(wall => {
      let entity = this.game.add.sprite(wall.x, wall.y, 'transparent')
      entity.width = wall.width
      entity.height = wall.height
      this.game.physics.enable(entity)
      entity.body.immovable = true
      return entity
    })

    this.walls = this.game.add.group()
    this.walls.enableBody = true
    this.walls.addMultiple(wallEntities)

    // implement other object collisions
    let collideEntities = this.map.objects['Collisions'].map(obj => {
      let entity = this.game.add.sprite(obj.x, obj.y, 'transparent')
      entity.width = obj.width
      entity.height = obj.height
      this.game.physics.enable(entity)
      entity.body.immovable = true
      return entity
    })

    this.collisions = this.game.add.group()
    this.collisions.enableBody = true
    this.collisions.addMultiple(collideEntities)

    // define game player and character spritesheet
    this.player = this.game.add.sprite(this.startPoint.x, this.startPoint.y, 'character')

    // enable physics on player
    this.game.physics.enable(this.player)

    // add player physics properties
    this.player.body.bounce.y = PLAYER.BOUNCE
    this.player.body.gravity.y = PLAYER.GRAVITY
    this.player.body.maxVelocity = PLAYER.MAX_VELOCITY
    this.player.body.setSize(PLAYER.BOUNDING_BOX_X, PLAYER.BOUNDING_BOX_Y, PLAYER.BOUNDING_BOX_OFFSET_X, PLAYER.BOUNDING_BOX_OFFSET_Y)
    this.player.body.collideWorldBounds = true

    // add player animations
    PLAYER.ANIMATIONS.forEach(({name, sequence, delay}) => {
      this.player.animations.add(name, sequence, delay, true)
    })

    // follow player with camera
    this.game.camera.follow(this.player)

    // register cursor controls
    this.cursors = this.game.input.keyboard.createCursorKeys()

    // play ambient sounds
    this.game.sound.stopAll()
    this.game.sound.play('ambience', 1, true)
  }

  update() {
    // define momentum
    let moving = false
    let forcesX = []
    let forcesY = []

    // define active animation
    let activeAnimation = PLAYER.ANIMATION_IDLE

    // define active hazard
    let activeHazard = null

    if (!this.openInteraction) {
      // handle key bindings
      // ---

      if (this.cursors.up.isDown) {
        forcesY.push(-PLAYER.TORQUE)
      }

      if (this.cursors.down.isDown) {
        forcesY.push(PLAYER.TORQUE)
      }

      if (this.cursors.left.isDown) {
        forcesX.push(-PLAYER.TORQUE)
        activeAnimation = PLAYER.ANIMATION_LEFT
      }

      if (this.cursors.right.isDown) {
        forcesX.push(PLAYER.TORQUE)
        activeAnimation = PLAYER.ANIMATION_RIGHT
      }
    }

    // calculate final momentum
    let vector = [forcesX, forcesY].map(arr => (
      arr.reduce((mem, v) => mem + v, 0)
    ))

    // apply final movement vector
    let movementVector = new Phaser.Point(vector[0], vector[1])
    this.player.body.acceleration = movementVector

    if (!vector[0]) {
      // cancel horizontal movement
      this.player.body.velocity.x = 0
      // cancel any horizontal animation
      activeAnimation = PLAYER.ANIMATION_IDLE
    }

    if (!vector[1]) {
      // cancel vertical movement
      this.player.body.velocity.y = 0
    }

    // apply active animation
    if (activeAnimation) {
      this.player.animations.play(activeAnimation)
    } else {
      this.player.animations.stop()
      this.player.frame = 5
    }

    // collisions
    // ---

    // collide player with walls
    this.game.physics.arcade.collide(this.player, this.walls)

    // collide player with other collisions
    this.game.physics.arcade.collide(this.player, this.collisions)

    // overlap player with dungeon hazards
    let hazardCollision = this.game.physics.arcade.overlap(this.player, this.hazards, (player, hazard) => { activeHazard = hazard })

    // overlap player with end point
    this.game.physics.arcade.overlap(this.player, this.endPoint, this.proceedToEnding.bind(this))

    // handle actions
    // ---

    if (hazardCollision) {
      this.interaction.x = activeHazard.body.center.x - (this.interaction.width / 2)
      this.interaction.y = activeHazard.body.center.y - (this.interaction.height / 2)

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.E)) {
        this.handleHazardInteraction.call(this, activeHazard)
      }
    } else {
      this.interaction.x = -(this.interaction.width * 2)
      this.interaction.y = -(this.interaction.height * 2)
    }
  }

}
