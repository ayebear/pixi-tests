// Sorts Pixi.js display objects into buckets based on their z index
class ZBuckets {
	constructor() {
		this.buckets = new PIXI.Container()
		this.index = new Map()
	}

	clear() {
		this.buckets.removeChildren()
		this.index.clear()
	}

	addChild(child) {
		// Default z index to 0
		child.zIndex = parseInt(child.zIndex) || 0

		// Create the bucket first if it doesn't exist
		if (!this.index.has(child.zIndex)) {
			this.addBucket(child.zIndex)
		}

		// Add the child to the correct bucket
		this.buckets.children[this.index.get(child.zIndex)].addChild(child)
	}

	addBucket(zIndex = 0) {
		// Create and add the bucket, then sort the buckets
		let bucket = new PIXI.Container()
		bucket.zIndex = zIndex
		this.buckets.addChild(bucket)
		updateZIndex(this.buckets)

		// Rebuild the index (since the buckets were re-sorted)
		this.index = this.build(this.buckets)
	}

	// Returns a map from z index to bucket array ID
	build(buckets) {
		let index = new Map()
		buckets.children.forEach((value, key) => {
			index.set(value.zIndex, key)
		})
		return index
	}
}
