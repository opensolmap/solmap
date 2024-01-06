var PNG = require('pngjs').PNG;

const WIDTH = 1000;
const HEIGHT = 1000;

const PURPLE: RGB = { r: 153, g: 69, b: 255 };
const GREEN: RGB = { r: 20, g: 241, b: 149 };

interface RGB {
	r: number;
	g: number;
	b: number;
}

export function drawTxSizesVariableGrid(sizes: number[]) {
	const gridSize = 32;

	const png: typeof PNG = new PNG({
		width: WIDTH,
		height: HEIGHT,
		colorType: 2, // RGB, no alpha
	});

	// Set the background to GREEN
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			const idx = (WIDTH * y + x) * 4;
			png.data[idx] = GREEN.r;
			png.data[idx + 1] = GREEN.g;
			png.data[idx + 2] = GREEN.b;
			png.data[idx + 3] = 255;
		}
	}

	const minSize = 0;
	const maxSize = Math.max(...sizes);

	for (const size of sizes) {
		// Randomly scatter transactions over the image
		const offset_x = Math.floor(Math.random() * (WIDTH - gridSize));
		const offset_y = Math.floor(Math.random() * (HEIGHT - gridSize));

		const normalizedSize = (size - minSize) / (maxSize - minSize);

		const color = interpolateColor(GREEN, PURPLE, normalizedSize);

		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				const idx = (WIDTH * (offset_y + y) + (x + offset_x)) * 4;

				png.data[idx] = color.r;
				png.data[idx + 1] = color.g;
				png.data[idx + 2] = color.b;
				png.data[idx + 3] = 255;
			}
		}
	}

	// return a buffer
	return PNG.sync.write(png);
}

function interpolateColor(color1: RGB, color2: RGB, weight: number): RGB {
	if (color1 && color2) {
		const r = Math.round(color1.r + weight * (color2.r - color1.r));
		const g = Math.round(color1.g + weight * (color2.g - color1.g));
		const b = Math.round(color1.b + weight * (color2.b - color1.b));

		return { r, g, b };
	} else {
		throw new Error('Invalid color input');
	}
}
