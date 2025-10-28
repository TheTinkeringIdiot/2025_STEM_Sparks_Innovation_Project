/**
 * HUD and UI Rendering
 *
 * Renders HUD elements to UI layer (z-index: 3) which appears above fog layer (z-index: 2).
 * Implements:
 * - Top-left: Money display in pixel font
 * - Bottom-center: Tool inventory bar with 6 slots (stadia rod, magnifying glass, 4 excavation tools)
 * - Bottom-right: Minimap (150x100px) with fog integration
 *
 * UI layer only redraws when state changes (money update, tool selection, level load).
 * Does NOT redraw every frame.
 */

class HUDRenderer {
  /**
   * Creates a HUD renderer
   * @param {number} viewportWidth - Viewport width in pixels (1440)
   * @param {number} viewportHeight - Viewport height in pixels (960)
   * @param {Minimap} minimap - Minimap instance for rendering
   */
  constructor(viewportWidth, viewportHeight, minimap) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.minimap = minimap;

    // Tool inventory configuration
    this.toolSlots = [
      'stadia_rod',
      'magnifying_glass',
      'shovel',
      'pickaxe',
      'brush',
      'hammer_chisel'
    ];

    // Tool inventory bar dimensions
    this.slotSize = 48; // Each slot is 48x48 pixels
    this.slotPadding = 4; // Padding between slots
    this.inventoryBarWidth = this.toolSlots.length * (this.slotSize + this.slotPadding) - this.slotPadding;
    this.inventoryBarHeight = this.slotSize;

    // Position inventory bar at bottom-center (round coordinates for performance)
    this.inventoryBarX = Math.round((viewportWidth - this.inventoryBarWidth) / 2);
    this.inventoryBarY = Math.round(viewportHeight - this.inventoryBarHeight - 20);

    // Minimap position (bottom-right, round coordinates for performance)
    this.minimapX = Math.round(viewportWidth - 150 - 20);
    this.minimapY = Math.round(viewportHeight - 100 - 20);

    // Money display position (top-left)
    this.moneyX = 20;
    this.moneyY = 30;

    // Cache state to detect changes
    this.cachedState = {
      money: -1,
      currentTool: null,
      unlockedTools: [],
      levelNumber: -1
    };

    // Mouse click state for tool selection
    this.clickHandled = false;
  }

  /**
   * Checks if HUD needs redraw by comparing current state to cached state
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if HUD needs redraw
   */
  needsRedraw(gameState) {
    const moneyChanged = this.cachedState.money !== gameState.player.money;
    const toolChanged = this.cachedState.currentTool !== gameState.player.currentTool;
    const levelChanged = this.cachedState.levelNumber !== gameState.level.number;

    // Check if unlocked tools changed
    const unlockedToolsChanged =
      JSON.stringify(this.cachedState.unlockedTools) !==
      JSON.stringify(gameState.player.inventory);

    return moneyChanged || toolChanged || levelChanged || unlockedToolsChanged;
  }

  /**
   * Updates cached state after rendering
   * @param {Object} gameState - Current game state
   */
  updateCache(gameState) {
    this.cachedState.money = gameState.player.money;
    this.cachedState.currentTool = gameState.player.currentTool;
    this.cachedState.levelNumber = gameState.level.number;
    this.cachedState.unlockedTools = [...gameState.player.inventory];
  }

  /**
   * Renders the complete HUD to the UI layer
   * Only redraws when state changes
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {Object} gameState - Current game state
   * @param {FogOfWar} fog - Fog-of-war instance for minimap
   * @param {number} timestamp - Current timestamp for minimap throttling
   */
  render(ctx, gameState, fog, timestamp) {
    // Check if redraw is needed
    if (!this.needsRedraw(gameState)) {
      // Still need to update minimap (it has its own throttling)
      if (gameState.player.position) {
        const playerTileX = Math.floor(gameState.player.position.x / 40);
        const playerTileY = Math.floor(gameState.player.position.y / 40);
        this.minimap.update(fog, playerTileX, playerTileY, timestamp);
      }
      return; // No redraw needed
    }

    // Clear UI layer before redrawing
    ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Render money display (top-left)
    this.renderMoney(ctx, gameState.player.money);

    // Render tool inventory bar (bottom-center)
    this.renderInventoryBar(ctx, gameState.player.inventory, gameState.player.currentTool);

    // Render minimap (bottom-right)
    if (gameState.player.position) {
      const playerTileX = Math.floor(gameState.player.position.x / 40);
      const playerTileY = Math.floor(gameState.player.position.y / 40);
      this.minimap.update(fog, playerTileX, playerTileY, timestamp);
    }
    this.minimap.render(ctx, this.minimapX, this.minimapY);

    // Update cached state
    this.updateCache(gameState);
  }

  /**
   * Renders money display in top-left corner
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {number} money - Current player money
   */
  renderMoney(ctx, money) {
    // Background panel (round coordinates for performance)
    const panelX = Math.round(this.moneyX - 10);
    const panelY = Math.round(this.moneyY - 25);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(panelX, panelY, 120, 35);

    // Border
    ctx.strokeStyle = '#FFD700'; // Gold color
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, 120, 35);

    // Money text in pixel font style
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`$${money}`, this.moneyX, this.moneyY);
  }

  /**
   * Renders tool inventory bar at bottom-center
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {Array<string>} unlockedTools - Array of unlocked tool IDs
   * @param {string} currentTool - Currently selected tool ID
   */
  renderInventoryBar(ctx, unlockedTools, currentTool) {
    // Background panel (round coordinates for performance)
    const panelX = Math.round(this.inventoryBarX - 8);
    const panelY = Math.round(this.inventoryBarY - 8);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      panelX,
      panelY,
      this.inventoryBarWidth + 16,
      this.inventoryBarHeight + 16
    );

    // Render each tool slot
    for (let i = 0; i < this.toolSlots.length; i++) {
      const toolId = this.toolSlots[i];
      const slotX = Math.round(this.inventoryBarX + i * (this.slotSize + this.slotPadding));
      const slotY = Math.round(this.inventoryBarY);
      const isUnlocked = unlockedTools.includes(toolId);
      const isSelected = currentTool === toolId;

      this.renderToolSlot(ctx, slotX, slotY, toolId, isUnlocked, isSelected);
    }
  }

  /**
   * Renders a single tool slot
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {number} x - Slot X position
   * @param {number} y - Slot Y position
   * @param {string} toolId - Tool identifier
   * @param {boolean} isUnlocked - Whether tool is unlocked
   * @param {boolean} isSelected - Whether tool is currently selected
   */
  renderToolSlot(ctx, x, y, toolId, isUnlocked, isSelected) {
    // Draw slot background
    if (isSelected) {
      // Highlighted background for selected tool
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Gold highlight
    } else {
      ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
    }
    ctx.fillRect(x, y, this.slotSize, this.slotSize);

    // Draw slot border
    if (isSelected) {
      ctx.strokeStyle = '#FFD700'; // Gold border for selected
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(x, y, this.slotSize, this.slotSize);

    // Draw tool icon/text
    if (isUnlocked) {
      this.renderToolIcon(ctx, x, y, toolId, false);
    } else {
      // Gray out locked tools
      this.renderToolIcon(ctx, x, y, toolId, true);
    }
  }

  /**
   * Renders tool icon or placeholder text
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {number} x - Slot X position
   * @param {number} y - Slot Y position
   * @param {string} toolId - Tool identifier
   * @param {boolean} isLocked - Whether tool is locked (grayed out)
   */
  renderToolIcon(ctx, x, y, toolId, isLocked) {
    // Tool display names (abbreviated for small slots)
    const toolNames = {
      stadia_rod: 'ROD',
      magnifying_glass: 'MAG',
      shovel: 'SHV',
      pickaxe: 'PIK',
      brush: 'BRS',
      hammer_chisel: 'H&C'
    };

    // Tool icons using simple shapes (round coordinates for performance)
    const centerX = Math.round(x + this.slotSize / 2);
    const centerY = Math.round(y + this.slotSize / 2);

    ctx.save();

    // Apply gray filter for locked tools
    if (isLocked) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#666666';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }

    // Draw simple tool representation
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toolNames[toolId] || '?', centerX, centerY);

    ctx.restore();
  }

  /**
   * Handles mouse click for tool selection in inventory bar
   * Returns selected tool ID if click was in inventory bar, null otherwise
   * @param {number} mouseX - Mouse X position in canvas coordinates
   * @param {number} mouseY - Mouse Y position in canvas coordinates
   * @param {Array<string>} unlockedTools - Array of unlocked tool IDs
   * @returns {string|null} Selected tool ID or null
   */
  handleInventoryClick(mouseX, mouseY, unlockedTools) {
    // Check if click is within inventory bar bounds
    if (
      mouseX < this.inventoryBarX ||
      mouseX > this.inventoryBarX + this.inventoryBarWidth ||
      mouseY < this.inventoryBarY ||
      mouseY > this.inventoryBarY + this.inventoryBarHeight
    ) {
      return null; // Click outside inventory bar
    }

    // Determine which slot was clicked
    const relativeX = mouseX - this.inventoryBarX;
    const slotIndex = Math.floor(relativeX / (this.slotSize + this.slotPadding));

    if (slotIndex < 0 || slotIndex >= this.toolSlots.length) {
      return null; // Invalid slot
    }

    const toolId = this.toolSlots[slotIndex];

    // Only allow selection of unlocked tools
    if (!unlockedTools.includes(toolId)) {
      return null; // Tool not unlocked
    }

    return toolId;
  }

  /**
   * Processes mouse input for tool selection
   * Call this from game loop to handle tool selection clicks
   * @param {Object} inputState - Input manager state
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if tool selection changed
   */
  processInput(inputState, gameState) {
    // Detect mouse button down -> up transition for click
    if (inputState.mouse.leftButton) {
      this.clickHandled = false;
      return false;
    }

    // Mouse button released - check if it was over inventory bar
    if (!this.clickHandled) {
      this.clickHandled = true;

      const selectedTool = this.handleInventoryClick(
        inputState.mouse.x,
        inputState.mouse.y,
        gameState.player.inventory
      );

      if (selectedTool) {
        // Update current tool in game state
        gameState.player.currentTool = selectedTool;
        return true; // Tool selection changed
      }
    }

    return false;
  }

  /**
   * Forces an immediate HUD redraw (bypasses cache check)
   * Useful for level transitions
   * @param {CanvasRenderingContext2D} ctx - UI layer canvas context
   * @param {Object} gameState - Current game state
   * @param {FogOfWar} fog - Fog-of-war instance for minimap
   */
  forceRedraw(ctx, gameState, fog) {
    // Reset cache to force redraw
    this.cachedState.money = -1;
    this.cachedState.currentTool = null;
    this.cachedState.levelNumber = -1;
    this.cachedState.unlockedTools = [];

    // Force minimap update too
    if (gameState.player.position) {
      const playerTileX = Math.floor(gameState.player.position.x / 40);
      const playerTileY = Math.floor(gameState.player.position.y / 40);
      this.minimap.forceUpdate(fog, playerTileX, playerTileY);
    }

    // Render
    this.render(ctx, gameState, fog, Date.now());
  }

  /**
   * Gets inventory bar bounds for hit testing
   * @returns {Object} Bounds object with x, y, width, height
   */
  getInventoryBarBounds() {
    return {
      x: this.inventoryBarX,
      y: this.inventoryBarY,
      width: this.inventoryBarWidth,
      height: this.inventoryBarHeight
    };
  }

  /**
   * Resets HUD for new level
   */
  reset() {
    this.cachedState = {
      money: -1,
      currentTool: null,
      unlockedTools: [],
      levelNumber: -1
    };
    this.clickHandled = false;
    this.minimap.reset();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HUDRenderer };
}
