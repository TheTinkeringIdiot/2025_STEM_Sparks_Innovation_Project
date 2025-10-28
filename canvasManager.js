/**
 * Multi-Layer Canvas Manager
 * Manages four stacked canvas layers with CSS positioning for optimal performance
 * by separating static and dynamic content. Only changed layers need repainting.
 */

class CanvasManager {
  constructor(containerId, width, height) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = container;
    this.container.style.position = 'relative';

    // Map to store layer references
    this.layers = new Map();

    // Create layers in z-index order
    // background (z-index: 0) - Static tile map, rarely changes
    this.createLayer('background', 0, width, height);

    // entities (z-index: 1) - Player, artifacts, NPCs, updates every frame
    this.createLayer('entities', 1, width, height);

    // fog (z-index: 2) - Visibility mask, updates when player moves
    this.createLayer('fog', 2, width, height);

    // ui (z-index: 3) - Health, inventory, messages, updates on state change
    this.createLayer('ui', 3, width, height);
  }

  /**
   * Creates a single canvas layer with specified properties
   * @param {string} name - Layer identifier
   * @param {number} zIndex - Stacking order
   * @param {number} width - Canvas width in pixels
   * @param {number} height - Canvas height in pixels
   */
  createLayer(name, zIndex, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = zIndex.toString();

    // Get 2D context
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`Failed to get 2D context for layer ${name}`);
    }

    // Disable image smoothing for pixel-perfect rendering (40x40px sprites)
    context.imageSmoothingEnabled = false;

    // Append to container
    this.container.appendChild(canvas);

    // Store layer data
    this.layers.set(name, {
      canvas: canvas,
      context: context,
      zIndex: zIndex,
      needsRedraw: true
    });
  }

  /**
   * Retrieves a layer by name
   * @param {string} name - Layer identifier
   * @returns {Object} Layer object with canvas, context, zIndex, needsRedraw
   */
  getLayer(name) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw new Error(`Layer ${name} not found`);
    }
    return layer;
  }

  /**
   * Marks a layer as needing redraw
   * @param {string} layerName - Layer identifier
   */
  markDirty(layerName) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer ${layerName} not found`);
    }
    layer.needsRedraw = true;
  }

  /**
   * Clears entire layer
   * @param {string} name - Layer identifier
   */
  clearLayer(name) {
    const layer = this.getLayer(name);
    layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
}
