/**
 * Artifact Inventory UI
 *
 * Displays collected artifacts in a toggleable overlay panel.
 * Press 'I' key to open/close the inventory view.
 *
 * Shows artifact name, description, and value for each collected item.
 */

class ArtifactInventory {
  /**
   * @param {number} viewportWidth - Viewport width in pixels
   * @param {number} viewportHeight - Viewport height in pixels
   */
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    /** @type {boolean} */
    this.isOpen = false;

    // Panel dimensions
    this.panelWidth = 500;
    this.panelHeight = 450;
    this.panelX = Math.round((viewportWidth - this.panelWidth) / 2);
    this.panelY = Math.round((viewportHeight - this.panelHeight) / 2);

    // Layout constants
    this.padding = 20;
    this.headerHeight = 70;  // Title + close hint
    this.footerHeight = 50;  // Total value area
    this.itemHeight = 60;
    this.itemGap = 10;

    // Scrolling
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.scrollSpeed = 40;

    // Track key state for toggle detection
    this.wasKeyPressed = false;

    // Cached artifact count for scroll calculation
    this.lastArtifactCount = 0;
  }

  /**
   * Attach scroll wheel listener to canvas
   * @param {HTMLCanvasElement} canvas - Canvas element for wheel events
   */
  attachWheelListener(canvas) {
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  /**
   * Handle mouse wheel for scrolling
   * @param {WheelEvent} event
   */
  handleWheel = (event) => {
    if (!this.isOpen) return;

    event.preventDefault();

    // Scroll based on wheel delta
    const delta = event.deltaY > 0 ? this.scrollSpeed : -this.scrollSpeed;
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + delta));
  }

  /**
   * Toggle inventory open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.scrollOffset = 0;
  }

  /**
   * Open inventory
   */
  open() {
    this.isOpen = true;
    this.scrollOffset = 0;
  }

  /**
   * Close inventory
   */
  close() {
    this.isOpen = false;
  }

  /**
   * Process input for inventory toggle
   * @param {Object} input - Input state from InputManager
   * @returns {boolean} True if inventory state changed
   */
  processInput(input) {
    // Detect key press (not hold) - trigger on key down edge
    if (input.keys.i && !this.wasKeyPressed) {
      this.wasKeyPressed = true;
      this.toggle();
      return true;
    }

    if (!input.keys.i) {
      this.wasKeyPressed = false;
    }

    return false;
  }

  /**
   * Render the inventory panel
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<string>} artifactIds - Array of collected artifact IDs
   */
  render(ctx, artifactIds) {
    if (!this.isOpen) {
      return;
    }

    // Calculate scroll bounds
    const contentAreaHeight = this.panelHeight - this.headerHeight - this.footerHeight - this.padding;
    const totalContentHeight = artifactIds.length * (this.itemHeight + this.itemGap) - this.itemGap;
    this.maxScrollOffset = Math.max(0, totalContentHeight - contentAreaHeight);

    // Clamp scroll offset if artifacts were removed
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScrollOffset);

    ctx.save();

    // Semi-transparent backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Panel background
    ctx.fillStyle = '#2a1810';
    ctx.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);

    // Panel border
    ctx.strokeStyle = '#8b6f47';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);

    // Title
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#f4e4c1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Collected Artifacts', this.panelX + this.panelWidth / 2, this.panelY + this.padding);

    // Close hint + scroll hint
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#a0a0a0';
    const hint = artifactIds.length > 0 && this.maxScrollOffset > 0
      ? 'Press I to close | Scroll to browse'
      : 'Press I to close';
    ctx.fillText(hint, this.panelX + this.panelWidth / 2, this.panelY + this.padding + 35);

    // Content area bounds
    const contentX = this.panelX + this.padding;
    const contentY = this.panelY + this.headerHeight;
    const contentWidth = this.panelWidth - this.padding * 2 - (this.maxScrollOffset > 0 ? 15 : 0); // Reserve space for scrollbar

    // Clip to content area
    ctx.beginPath();
    ctx.rect(contentX, contentY, contentWidth, contentAreaHeight);
    ctx.clip();

    if (artifactIds.length === 0) {
      // Empty state
      ctx.font = '18px Arial, sans-serif';
      ctx.fillStyle = '#808080';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No artifacts collected yet', this.panelX + this.panelWidth / 2, contentY + contentAreaHeight / 2);
    } else {
      // Render artifacts
      let y = contentY - this.scrollOffset;

      for (const artifactId of artifactIds) {
        const artifact = getArtifact(artifactId);
        if (!artifact) continue;

        // Skip if above viewport
        if (y + this.itemHeight < contentY) {
          y += this.itemHeight + this.itemGap;
          continue;
        }

        // Stop if below viewport
        if (y > contentY + contentAreaHeight) {
          break;
        }

        this.renderArtifactItem(ctx, artifact, contentX, y, contentWidth);
        y += this.itemHeight + this.itemGap;
      }
    }

    ctx.restore();

    // Render scrollbar (outside clip region)
    if (this.maxScrollOffset > 0) {
      this.renderScrollbar(ctx, contentY, contentAreaHeight);
    }

    // Render footer separator and total value (fixed at bottom)
    this.renderFooter(ctx, artifactIds);
  }

  /**
   * Render scrollbar
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} contentY - Y position of content area
   * @param {number} contentHeight - Height of content area
   */
  renderScrollbar(ctx, contentY, contentHeight) {
    const scrollbarX = this.panelX + this.panelWidth - this.padding - 8;
    const scrollbarWidth = 6;

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(scrollbarX, contentY, scrollbarWidth, contentHeight);

    // Calculate thumb size and position
    const visibleRatio = contentHeight / (contentHeight + this.maxScrollOffset);
    const thumbHeight = Math.max(30, contentHeight * visibleRatio);
    const scrollRatio = this.scrollOffset / this.maxScrollOffset;
    const thumbY = contentY + (contentHeight - thumbHeight) * scrollRatio;

    // Thumb
    ctx.fillStyle = 'rgba(139, 111, 71, 0.8)';
    ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
  }

  /**
   * Render footer with separator and total value
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<string>} artifactIds - Array of collected artifact IDs
   */
  renderFooter(ctx, artifactIds) {
    const footerY = this.panelY + this.panelHeight - this.footerHeight;

    // Separator line
    ctx.strokeStyle = '#8b6f47';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.panelX + this.padding, footerY);
    ctx.lineTo(this.panelX + this.panelWidth - this.padding, footerY);
    ctx.stroke();

    // Calculate total value
    let totalValue = 0;
    for (const artifactId of artifactIds) {
      const artifact = getArtifact(artifactId);
      if (artifact) {
        totalValue += artifact.value;
      }
    }

    // Render total
    const textY = footerY + this.footerHeight / 2;

    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = '#f4e4c1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Total Value (${artifactIds.length} items):`, this.panelX + this.padding, textY);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalValue}`, this.panelX + this.panelWidth - this.padding, textY);
  }

  /**
   * Render a single artifact item
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} artifact - Artifact data from catalog
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width of item
   */
  renderArtifactItem(ctx, artifact, x, y, width) {

    // Item background
    ctx.fillStyle = artifact.isJunk ? 'rgba(80, 60, 40, 0.6)' : 'rgba(60, 80, 40, 0.6)';
    ctx.fillRect(x, y, width, this.itemHeight);

    // Item border
    ctx.strokeStyle = artifact.isJunk ? '#6b5b47' : '#7b9b47';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, this.itemHeight);

    // Artifact name
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = artifact.isJunk ? '#c0b0a0' : '#d0e0c0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(artifact.name, x + 10, y + 8);

    // Value (right side)
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(`$${artifact.value}`, x + width - 10, y + 8);

    // Description (truncated if needed)
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'left';

    let description = artifact.description;
    const maxWidth = width - 20;
    const metrics = ctx.measureText(description);
    if (metrics.width > maxWidth) {
      // Truncate with ellipsis
      while (ctx.measureText(description + '...').width > maxWidth && description.length > 0) {
        description = description.slice(0, -1);
      }
      description += '...';
    }
    ctx.fillText(description, x + 10, y + 32);
  }

  /**
   * Check if inventory is currently open
   * @returns {boolean}
   */
  isVisible() {
    return this.isOpen;
  }
}
