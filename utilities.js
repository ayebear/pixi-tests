function interpolate(start, end, ratio = 0.5) {
	return {
		x: start.x + ((end.x - start.x) * ratio),
		y: start.y + ((end.y - start.y) * ratio)
	}
}

// Clones a parent pixi sprite/container
function cloneContainer(container) {
	let clone

	if (container.texture) {
		// Assume container is a pixi sprite
		// TODO: Copy all other properties such as scaling, colors, etc.
		clone = new PIXI.Sprite(container.texture)
		clone.anchor.x = container.anchor.x
		clone.anchor.y = container.anchor.y
	} else {
		// Assume container is a pixi container
		clone = new PIXI.Container()
	}

	// Copy position
	clone.x = container.x
	clone.y = container.y

	clone.zIndex = container.zIndex

	return clone
}

// Clones a pixi container recursively
function dupe(container) {

	// Clone current, parent sprite
	let clone = cloneContainer(container)

	if (container.children) {
		for (let child of container.children) {
			// Duplicate children recursively
			clone.addChild(dupe(child))
		}
	}
	return clone
}

function updateZIndex(container) {
	container.children.sort((a, b) => {
		a.zIndex = a.zIndex || 0
		b.zIndex = b.zIndex || 0
		return a.zIndex - b.zIndex
	})
}
