/**
 * Seeded Random Number Generator using Mulberry32 algorithm
 * Provides deterministic pseudo-random numbers for reproducible level generation
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  /**
   * Mulberry32 PRNG - generates next random float
   * @returns {number} Random float between 0.0 and 1.0
   */
  next() {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min and max (inclusive)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer in range [min, max]
   */
  intBetween(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Select random element from array
   * @param {Array} array - Array to choose from
   * @returns {*} Random element from array
   */
  choice(array) {
    return array[this.intBetween(0, array.length - 1)];
  }

  /**
   * Select item based on weight property
   * Items must have a 'weight' property (number)
   * @param {Array<{weight: number}>} items - Array of items with weight property
   * @returns {*} Selected item based on weighted probability
   */
  weightedChoice(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }

    return items[0];
  }

  /**
   * Simplified Perlin noise function using seed offset
   * Generates smooth pseudo-random values for terrain generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Noise value between -1.0 and 1.0
   */
  perlin(x, y) {
    // Use seed to offset coordinates for unique noise per seed
    x += this.seed * 0.1;
    y += this.seed * 0.1;

    // Simple noise approximation
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const hash = (a, b) => {
      let h = this.seed + a * 374761393 + b * 668265263;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };

    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const lerp = (a, b, t) => a + t * (b - a);

    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
  }
}
