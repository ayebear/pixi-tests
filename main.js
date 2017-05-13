const speed = 5

function duplicateSprite(sprite, offset) {
	let clone = new PIXI.Sprite(sprite.texture)
	// clone.anchor.set(0.5)
	clone.x = sprite.x + offset.x
	clone.y = sprite.y + offset.y
	clone.zIndex = sprite.zIndex

	// TODO: Copy all other properties such as anchor points, scaling, colors, etc.
	// TODO: Recursively copy objects, or flatten them out

	return clone
}

class RenderWrap {
	constructor(stageToRepeat, app, offset) {
		this.stage = stageToRepeat
		this.app = app
		this.offset = offset

		// this.stage is temporary stage as input
		// this.app.stage is what we are drawing to the screen

		this.update()
	}

	// Generates duplicated sprites from a single sprite
	generateSprites(spriteToRepeat, renderSize, stageSize) {
		// Calculate the minimum grid size to cover the rendering area
		const width = Math.ceil((renderSize.x / this.scale) / stageSize.x)
		const height = Math.ceil((renderSize.y / this.scale) / stageSize.y)

		let container = new PIXI.Container()

		// Generate the sprites
		// console.log(`Grid size: ${width * 2} by ${height * 2}`)
		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				// Duplicate the sprite for all the positions
				let sprite = duplicateSprite(spriteToRepeat, {x: x * stageSize.x, y: y * stageSize.y})

				// Add this sprite to the main rendering stage
				container.addChild(sprite)
			}
		}

		return container
	}

	// Only need to call this on resize or camera change
	// Rebuilds the drawing stage to repeat the input stage
	update() {
		// Calculate sizes
		const renderSize = {
			x: this.app.renderer.width,
			y: this.app.renderer.height
		}
		const stageSize = this.offset || {
			x: Math.floor(this.stage.width),
			y: Math.floor(this.stage.height)
		}

		// Clear the grid
		this.app.stage.removeChildren()

		// Go through input children, duplicating everything, and adding it to the output stage
		for (let child of this.stage.children) {
			let dupes = this.generateSprites(child, renderSize, stageSize)
			this.app.stage.addChild(dupes)
		}
	}

	get scale() {
		return this.app.stage.scale.x
	}

	set scale(scale) {
		this.app.stage.scale.x = scale
		this.app.stage.scale.y = scale
		this.update()
	}
}

class Test {
	constructor() {
		const offset = {x: 256, y: 256}

		this.move = {x: 0, y: 0}
		this.listener = new window.keypress.Listener()
		this.registerKey('w', 'y', -1)
		this.registerKey('s', 'y', 1)
		this.registerKey('a', 'x', -1)
		this.registerKey('d', 'x', 1)

		// Zooming in/out
		this.listener.simple_combo('o', () => {
			this.wrapper.scale = 0.98 * this.wrapper.scale
		})
		this.listener.simple_combo('i', () => {
			this.wrapper.scale = 1.02 * this.wrapper.scale
		})

		this.stage = new PIXI.Container()

		this.app = new PIXI.Application({backgroundColor: 0x1099bb});
		this.app.renderer.autoResize = true
		document.body.appendChild(this.app.view);

		// create a new Sprite from an image path
		this.bunny = PIXI.Sprite.fromImage('bunny.png')
		this.background = PIXI.Sprite.fromImage('background.png')

		// center the sprite's anchor point
		// this.bunny.anchor.set(0.5);

		// move the sprite to the center of the screen
		this.bunny.x = 128;
		this.bunny.y = 128;

		// let dupe = duplicateSprite(this.bunny, {x: 40, y: 40})

		this.stage.addChild(this.background);
		// this.stage.addChild(dupe);
		this.stage.addChild(this.bunny);

		this.wrapper = new RenderWrap(this.stage, this.app, offset)

		// Listen for animate update
		this.app.ticker.add(delta => {
			// just for fun, let's rotate mr rabbit a little
			// delta is 1 if running at 100% performance
			// creates frame-independent tranformation
			this.bunny.position.x += delta * this.move.x * speed;
			this.bunny.position.y += delta * this.move.y * speed;

			this.wrapper.update()
		});
	}

	registerKey(key, axis, value) {
		this.listener.register_combo({
			keys: key,
			on_keydown: e => {
				this.move[axis] = value
			},
			on_keyup: e => {
				this.move[axis] = 0
			}
		})
	}
}

window.onload = function() {
	new Test()
}
