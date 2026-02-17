/**
 * Visual Effects for Archeology Game
 *
 * Implements three visual effects:
 * 1. GlowingPOIMarker - Pre-rendered rhombus with gold glow and pulse animation
 * 2. FlashEffect - Red screen edge overlay on wrong tool use
 * 3. ConfettiSystem - Particle system for artifact extraction celebration
 */

/**
 * Glowing POI Marker with pre-rendered glow effect
 * Pre-renders a 20x20px rhombus with gold glow to offscreen canvas for performance
 * Optional pulse animation scales between 1.0-1.1 using sine wave
 */
class GlowingPOIMarker {
  /**
   * @param {number} size - Base size of the rhombus (default 20px)
   */
  constructor(size = 20) {
    this.size = size;
    this.glowCanvas = this.createGlowCanvas();
    this.pulseTime = 0;
  }

  /**
   * Pre-renders the glowing rhombus to an offscreen canvas
   * This is done once during initialization for performance
   * @returns {HTMLCanvasElement} - Offscreen canvas with rendered glow
   */
  createGlowCanvas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Add padding for glow effect (15px on each side)
    canvas.width = this.size + 30;
    canvas.height = this.size + 30;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw rhombus with gold glow
    ctx.shadowColor = '#FFD700'; // gold
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#FFA500'; // orange

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - this.size / 2);
    ctx.lineTo(centerX + this.size / 2, centerY);
    ctx.lineTo(centerX, centerY + this.size / 2);
    ctx.lineTo(centerX - this.size / 2, centerY);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  /**
   * Updates the pulse animation
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    // Animate pulse - multiply by 0.001 to convert ms to seconds
    this.pulseTime += deltaTime * 0.001;
  }

  /**
   * Renders the glowing POI marker at specified position
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} x - X coordinate (center of marker)
   * @param {number} y - Y coordinate (center of marker)
   */
  render(ctx, x, y) {
    // Pulse effect: scale oscillates between 1.0 and 1.1
    const scale = 1 + Math.sin(this.pulseTime * 3) * 0.1;
    const drawSize = this.glowCanvas.width * scale;

    // Draw pre-rendered glow canvas centered at (x, y)
    ctx.drawImage(
      this.glowCanvas,
      Math.round(x - drawSize / 2),
      Math.round(y - drawSize / 2),
      drawSize,
      drawSize
    );
  }
}

/**
 * Red Flash Effect for wrong tool usage feedback
 * Creates a red overlay on screen edges that fades out over 200ms
 */
class FlashEffect {
  constructor() {
    this.active = false;
    this.duration = 0;
    this.maxDuration = 200; // 200ms as per requirements
  }

  /**
   * Triggers the flash effect
   * Called when player uses wrong tool on POI
   */
  trigger() {
    this.active = true;
    this.duration = 0;
  }

  /**
   * Updates the flash effect duration
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    if (this.active) {
      this.duration += deltaTime;
      if (this.duration >= this.maxDuration) {
        this.active = false;
      }
    }
  }

  /**
   * Renders the red flash overlay
   * Uses globalAlpha for fade-out effect
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} canvasWidth - Width of the canvas
   * @param {number} canvasHeight - Height of the canvas
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!this.active) return;

    // Fade out over duration
    const alpha = 1 - (this.duration / this.maxDuration);

    ctx.save();
    ctx.globalAlpha = alpha * 0.7; // Max 70% opacity
    ctx.fillStyle = '#FF0000';
    // Round coordinates for performance (always use integers)
    ctx.fillRect(0, 0, Math.round(canvasWidth), Math.round(canvasHeight));
    ctx.restore();
  }
}

/**
 * Confetti Particle System for celebration effects
 * Creates 30-50 particles with physics (gravity, velocity) that fade over 2 seconds
 */
class ConfettiSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Emits confetti particles from a specified location
   * @param {number} x - X coordinate of emission point
   * @param {number} y - Y coordinate of emission point
   * @param {number} count - Number of particles to emit (30-50 recommended)
   */
  emit(x, y, count = 40) {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#4169E1'];

    for (let i = 0; i < count; i++) {
      // Spread particles in all directions with some randomness
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward velocity
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
        life: 1, // 0-1, where 1 is fully alive
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  /**
   * Updates all particles with physics simulation
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    const dt = deltaTime * 0.001; // Convert to seconds

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics: Update position based on velocity
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.rotation += p.rotationSpeed;

      // Fade out over 2 seconds (life goes from 1 to 0)
      p.life -= dt * 0.5;

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Renders all active particles
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life; // Fade based on life
      ctx.fillStyle = p.color;
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate(p.rotation);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  /**
   * Returns true if there are active particles
   * @returns {boolean}
   */
  isActive() {
    return this.particles.length > 0;
  }

  /**
   * Clears all particles
   */
  clear() {
    this.particles = [];
  }
}

/**
 * Question Mark Border Effect
 * Renders floating "?" characters around the screen edges when the player
 * is near unexplored fog without the stadia rod equipped.
 * Creates a visual hint that the player should switch to their survey tool.
 */
class QuestionMarkEffect {
  constructor() {
    this.active = false;
    this.time = 0;
    this.opacity = 0; // Smooth fade in/out

    // Pre-generate fixed positions around screen border
    // Each mark has: edge (0-3 = top/right/bottom/left), t (0-1 along edge), phase offset
    this.marks = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      this.marks.push({
        edge: Math.floor(i / 6),         // 6 per edge
        t: (i % 6 + 0.5) / 6,            // evenly spaced along edge
        phase: (i * 1.7) % (Math.PI * 2), // unique phase offset
        size: 56 + (i * 7.3 % 24)        // 56-80px font size
      });
    }
  }

  /**
   * Updates the effect state based on player conditions
   * @param {number} deltaTime - Time elapsed in ms
   * @param {boolean} shouldShow - Whether the effect should currently display
   */
  update(deltaTime, shouldShow) {
    this.time += deltaTime * 0.001;

    // Smooth fade: ramp opacity toward target
    const target = shouldShow ? 1 : 0;
    const fadeSpeed = 3.0; // per second
    const step = fadeSpeed * deltaTime * 0.001;
    if (this.opacity < target) {
      this.opacity = Math.min(target, this.opacity + step);
    } else {
      this.opacity = Math.max(target, this.opacity - step);
    }

    this.active = this.opacity > 0.01;
  }

  /**
   * Renders floating question marks around screen edges
   * @param {CanvasRenderingContext2D} ctx - UI layer context
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  render(ctx, w, h) {
    if (!this.active) return;

    const margin = 30; // distance from screen edge
    const t = this.time;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const mark of this.marks) {
      // Position along edge
      let x, y;
      switch (mark.edge) {
        case 0: // top
          x = mark.t * w;
          y = margin;
          break;
        case 1: // right
          x = w - margin;
          y = mark.t * h;
          break;
        case 2: // bottom
          x = mark.t * w;
          y = h - margin;
          break;
        case 3: // left
          x = margin;
          y = mark.t * h;
          break;
      }

      // Gentle bob
      const bob = Math.sin(t * 1.5 + mark.phase) * 6;
      const drift = Math.cos(t * 0.8 + mark.phase * 0.5) * 4;
      x += (mark.edge % 2 === 0) ? drift : 0;
      y += (mark.edge % 2 === 0) ? 0 : bob;
      x += (mark.edge % 2 === 1) ? 0 : 0;
      y += (mark.edge % 2 === 1) ? 0 : bob;

      // Per-mark fade pulse
      const pulse = 0.4 + 0.6 * ((Math.sin(t * 2.0 + mark.phase) + 1) / 2);
      const alpha = this.opacity * pulse * 0.7;

      ctx.font = `bold ${mark.size}px monospace`;
      // Neon green glow
      ctx.shadowColor = `rgba(0, 255, 65, ${alpha})`;
      ctx.shadowBlur = 24;
      // Dark outline
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
      ctx.fillText('?', x + 2, y + 2);
      // Neon green core
      ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
      ctx.fillText('?', x, y);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
