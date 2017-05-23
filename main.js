const speed = 5

function interpolate(start, end, ratio = 0.5) {
	return {
		x: start.x + ((end.x - start.x) * ratio),
		y: start.y + ((end.y - start.y) * ratio)
	}
}

// Clones a pixi sprite/container
function cloneContainer(container, offset = {x: 0, y: 0}) {
	let clone

	if (container.texture) {
		// Assume container is a pixi sprite
		// TODO: Copy all other properties such as scaling, colors, etc.
		clone = new PIXI.Sprite(container.texture)
		clone.anchor.x = container.anchor.x
		clone.anchor.y = container.anchor.y
		clone.zIndex = container.zIndex
	} else {
		// Assume container is a pixi container
		clone = new PIXI.Container()
	}

	clone.x = container.x + offset.x
	clone.y = container.y + offset.y

	return clone
}

function dupe(container, offset) {

	// Clone current, parent sprite
	let clone = cloneContainer(container, offset)

	if (container.children) {
		for (let child of container.children) {
			// Uses the offset only for the root container
			clone.addChild(dupe(child))
		}
	}
	return clone
}

class RenderWrap {
	constructor(stageToRepeat, app, offset) {
		this.stage = stageToRepeat
		this.app = app

		// Size of the original game without repeating
		this.offset = offset || {
			x: Math.floor(this.stage.width),
			y: Math.floor(this.stage.height)
		}

		// this.stage is temporary stage as input
		// this.app.stage is what we are drawing to the screen

		this.update()
	}

	// Generates duplicated sprites from a single sprite
	generateSprites(spriteToRepeat, stageSize, gridSize) {
		let container = new PIXI.Container()

		// Adjust so that sprites are only on the screen, basically by a multiple of the stage size
		const diff = {
			x: Math.ceil((spriteToRepeat.x + (this.app.stage.x / this.scale)) / stageSize.x) * stageSize.x,
			y: Math.ceil((spriteToRepeat.y + (this.app.stage.y / this.scale)) / stageSize.y) * stageSize.y
		}

		// Generate the sprites
		for (let y = 0; y < gridSize.y; ++y) {
			for (let x = 0; x < gridSize.x; ++x) {
				// Duplicate the sprite for all the positions
				const repeatOffset = {
					x: x * stageSize.x - diff.x,
					y: y * stageSize.y - diff.y
				}
				let sprite = dupe(spriteToRepeat, repeatOffset)

				// Add this sprite to the main rendering stage
				container.addChild(sprite)
			}
		}

		return container
	}

	// Only need to call this on resize or camera change
	// Rebuilds the drawing stage to repeat the input stage
	update() {
		// Size of the game window
		const renderSize = {
			x: this.app.renderer.width,
			y: this.app.renderer.height
		}

		// Calculate the minimum grid size to cover the rendering area
		const gridSize = {
			x: Math.ceil(renderSize.x / (this.offset.x * this.scale)) + 1,
			y: Math.ceil(renderSize.y / (this.offset.y * this.scale)) + 1
		}

		// Clear the grid
		this.app.stage.removeChildren()

		// Go through input children, duplicating everything, and adding it to the output stage
		for (let child of this.stage.children) {
			let dupes = this.generateSprites(child, this.offset, gridSize)
			this.app.stage.addChild(dupes)
		}
	}

	get scale() {
		return this.app.stage.scale.x
	}

	set scale(scale) {
		this.app.stage.scale.x = scale
		this.app.stage.scale.y = scale
	}
}

class Test {
	constructor(resources) {
		this.move = {x: 0, y: 0}
		this.listener = new window.keypress.Listener()
		this.registerKey('w', 'y', -1)
		this.registerKey('s', 'y', 1)
		this.registerKey('a', 'x', -1)
		this.registerKey('d', 'x', 1)

		// This is our small game stage, which gets repeated by the special renderer
		this.stage = new PIXI.Container()

		// Create Pixi.js application
		this.app = new PIXI.Application(window.innerWidth - 4, window.innerHeight - 4, {backgroundColor: 0x1099bb});
		this.app.renderer.autoResize = true
		document.body.appendChild(this.app.view);

		// Create sprites from loaded textures
		this.bunny = new PIXI.Sprite(resources.bunny.texture)
		this.background = new PIXI.Sprite(resources.background.texture)

		let circle = new PIXI.Graphics()
			.lineStyle(4, 0xFF0000)
			.drawCircle(0, 0, 32)

		// move the sprite to the center of the screen
		this.bunny.anchor.set(0.5);
		this.bunny.x = 128;
		this.bunny.y = 128;

		this.stage.addChild(this.background);
		this.stage.addChild(this.bunny);

		this.wrapper = new RenderWrap(this.stage, this.app)

		let target = {x: 0, y: 0}
		let ratio = 0
		let zooming = 0

		// Zooming in/out
		this.listener.register_combo({
			keys: 'o',
			on_keydown: e => zooming = 0.98,
			on_keyup: e => zooming = 0
		})
		this.listener.register_combo({
			keys: 'i',
			on_keydown: e => zooming = 1.02,
			on_keyup: e => zooming = 0
		})

		// Toggle camera speed
		let fastCamera = true
		this.listener.simple_combo('c', e => fastCamera = !fastCamera)

		// Listen for animate update
		this.app.ticker.add(delta => {
			// Move bunny sprite
			this.bunny.position.x += delta * this.move.x * speed;
			this.bunny.position.y += delta * this.move.y * speed;

			// Handle zooming
			if (zooming !== 0) {
				this.wrapper.scale *= zooming
			}

			// Center camera
			const newTarget = {
				x: -this.bunny.position.x * this.wrapper.scale + (this.app.renderer.width / 2),
				y: -this.bunny.position.y * this.wrapper.scale + (this.app.renderer.height / 2)
			}

			if (fastCamera) {
				ratio = 1
			}
			else {
				// Update tweening ratio
				ratio += delta / 300

				// Don't go out of bounds - also, skip tween when zooming
				if (ratio >= 1 || zooming !== 0) {
					ratio = 1
				}

				// If the target changed, reset the tween (only if not currently zooming)
				if (zooming === 0 && (target.x !== newTarget.x || target.y !== newTarget.y)) {
					ratio = 0
				}
			}

			target = newTarget

			// Tween camera
			let stagePos = interpolate(this.app.stage, target, ratio)
			this.app.stage.x = stagePos.x
			this.app.stage.y = stagePos.y

			// Rebuild sprites
			this.wrapper.update()

			// Add center circle shape
			circle.x = this.bunny.position.x
			circle.y = this.bunny.position.y
			this.app.stage.addChild(circle)
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
	const loader = PIXI.loader;

	loader.add('bunny', './bunny.png')
		.add('background', './background.png');

	loader.load((loader, resources) => {
		new Test(resources)
	})
}
