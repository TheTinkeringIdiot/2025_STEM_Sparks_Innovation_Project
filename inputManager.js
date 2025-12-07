/**
 * InputManager - Centralized input state tracking for keyboard and mouse
 *
 * Tracks all input as state rather than handling events inline.
 * Returns immutable state snapshots to prevent external mutation.
 *
 * Keyboard: Attached to window (canvas doesn't receive focus by default)
 * Mouse: Attached to canvas with coordinate conversion via getBoundingClientRect()
 */
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    // Initialize input state
    this.state = {
      keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        up: false,
        down: false,
        left: false,
        right: false,
        space: false,
        i: false
      },
      mouse: {
        x: 0,
        y: 0,
        leftButton: false,
        rightButton: false
      }
    };

    this.attachListeners();
  }

  attachListeners() {
    // Keyboard events on window (not canvas - canvas doesn't receive focus by default)
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse events on canvas
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown = (event) => {
    const key = event.key.toLowerCase();

    switch (key) {
      case 'w':
        this.state.keys.w = true;
        break;
      case 'a':
        this.state.keys.a = true;
        break;
      case 's':
        this.state.keys.s = true;
        break;
      case 'd':
        this.state.keys.d = true;
        break;
      case 'arrowup':
        this.state.keys.up = true;
        event.preventDefault(); // Prevent page scroll
        break;
      case 'arrowdown':
        this.state.keys.down = true;
        event.preventDefault();
        break;
      case 'arrowleft':
        this.state.keys.left = true;
        event.preventDefault();
        break;
      case 'arrowright':
        this.state.keys.right = true;
        event.preventDefault();
        break;
      case ' ':
        this.state.keys.space = true;
        event.preventDefault();
        break;
      case 'i':
        this.state.keys.i = true;
        break;
    }
  }

  handleKeyUp = (event) => {
    const key = event.key.toLowerCase();

    switch (key) {
      case 'w':
        this.state.keys.w = false;
        break;
      case 'a':
        this.state.keys.a = false;
        break;
      case 's':
        this.state.keys.s = false;
        break;
      case 'd':
        this.state.keys.d = false;
        break;
      case 'arrowup':
        this.state.keys.up = false;
        break;
      case 'arrowdown':
        this.state.keys.down = false;
        break;
      case 'arrowleft':
        this.state.keys.left = false;
        break;
      case 'arrowright':
        this.state.keys.right = false;
        break;
      case ' ':
        this.state.keys.space = false;
        break;
      case 'i':
        this.state.keys.i = false;
        break;
    }
  }

  handleMouseDown = (event) => {
    if (event.button === 0) {
      this.state.mouse.leftButton = true;
    } else if (event.button === 2) {
      this.state.mouse.rightButton = true;
    }
  }

  handleMouseUp = (event) => {
    if (event.button === 0) {
      this.state.mouse.leftButton = false;
    } else if (event.button === 2) {
      this.state.mouse.rightButton = false;
    }
  }

  handleMouseMove = (event) => {
    // Convert to canvas coordinates using getBoundingClientRect()
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouse.x = event.clientX - rect.left;
    this.state.mouse.y = event.clientY - rect.top;
  }

  /**
   * Returns immutable state snapshot to prevent external mutation
   * @returns {Object} Copy of current input state
   */
  getState() {
    return {
      keys: { ...this.state.keys },
      mouse: { ...this.state.mouse }
    };
  }

  /**
   * Cleanup method to remove event listeners
   * Call this when destroying the input manager
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
  }
}
