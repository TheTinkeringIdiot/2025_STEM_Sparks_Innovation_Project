/**
 * Tool System and POI Interaction
 *
 * Implements the tool interaction system for the archeology game:
 * - Stadia rod: Always active for exploration (no-op)
 * - Magnifying glass: Shows hint text for correct tool at POI
 * - Excavation tools: Play animation, check if correct tool, update POI state
 * - Wrong tool (1st attempt): Red flash effect, increment wrongAttempts
 * - Wrong tool (2nd attempt): Remove POI, no artifact
 * - Correct tool: Play confetti, add artifact to inventory, remove POI
 *
 * Tool unlocks: L1=shovel, L2=pickaxe, L3=brush, L4=hammer&chisel
 * Block movement during tool animations (500ms)
 *
 * @module toolSystem
 */

/**
 * Tool System Manager
 * Handles all tool interactions, POI validation, and state management
 */
class ToolSystem {
  /**
   * @param {Object} gameState - Reference to game state
   * @param {CharacterAnimator} animator - Character animator for tool animations
   * @param {FlashEffect} flashEffect - Red flash effect for wrong tool
   * @param {ConfettiSystem} confettiSystem - Confetti system for celebration
   */
  constructor(gameState, animator, flashEffect, confettiSystem) {
    this.gameState = gameState;
    this.animator = animator;
    this.flashEffect = flashEffect;
    this.confettiSystem = confettiSystem;

    // Tool animation constants
    this.TOOL_ANIMATION_DURATION = 500; // ms - blocks movement
    this.isAnimating = false;
    this.animationStartTime = 0;

    // Current hint text (for magnifying glass)
    this.hintText = null;
    this.hintDuration = 3000; // ms - how long hint stays visible
    this.hintStartTime = 0;

    // Tool name mapping for display
    this.toolNames = {
      'shovel': 'Shovel',
      'pickaxe': 'Pickaxe',
      'brush': 'Brush',
      'hammer_chisel': 'Hammer & Chisel'
    };

    // Map tool IDs to animation states
    this.toolAnimationMap = {
      'shovel': 'digging',
      'pickaxe': 'pickaxing',
      'brush': 'brushing',
      'hammer_chisel': 'chiseling'
    };
  }

  /**
   * Update tool system state
   * Handles animation timing and hint text duration
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   */
  update(deltaTime) {
    // Update animation state
    if (this.isAnimating) {
      const elapsed = performance.now() - this.animationStartTime;
      if (elapsed >= this.TOOL_ANIMATION_DURATION) {
        this.isAnimating = false;
        // Return to idle state after animation
        if (this.animator) {
          this.animator.setState('idle', this.gameState.player.direction);
        }
      }
    }

    // Update hint text visibility
    if (this.hintText !== null) {
      const elapsed = performance.now() - this.hintStartTime;
      if (elapsed >= this.hintDuration) {
        this.hintText = null;
      }
    }
  }

  /**
   * Use the currently equipped tool
   * Handles all tool interactions including validation and state updates
   * @returns {boolean} True if tool was used successfully, false otherwise
   */
  useTool() {
    // Can't use tool while animation is playing
    if (this.isAnimating) {
      return false;
    }

    const currentTool = this.gameState.player.currentTool;

    // Handle stadia rod (no-op, always active)
    if (currentTool === 'stadia_rod') {
      return true;
    }

    // Handle magnifying glass (show hint)
    if (currentTool === 'magnifying_glass') {
      return this.useMagnifyingGlass();
    }

    // Handle excavation tools (shovel, pickaxe, brush, hammer_chisel)
    if (this.isExcavationTool(currentTool)) {
      return this.useExcavationTool(currentTool);
    }

    return false;
  }

  /**
   * Use magnifying glass to show hint about correct tool
   * @returns {boolean} True if hint was shown, false if no POI nearby
   */
  useMagnifyingGlass() {
    const nearbyPOI = this.findNearbyPOI();

    if (!nearbyPOI) {
      this.hintText = 'No site of interest nearby';
      this.hintStartTime = performance.now();
      return false;
    }

    // Get artifact and its required tool
    const artifact = getArtifact(nearbyPOI.artifact.id);
    if (!artifact) {
      this.hintText = 'Unknown artifact type';
      this.hintStartTime = performance.now();
      return false;
    }

    // Show hint about correct tool
    const toolName = this.toolNames[artifact.toolRequired];
    this.hintText = `Use ${toolName} to excavate this site`;
    this.hintStartTime = performance.now();
    return true;
  }

  /**
   * Use excavation tool on nearby POI
   * Handles animation, validation, and state updates
   * @param {string} toolId - ID of the excavation tool being used
   * @returns {boolean} True if tool was used, false if no POI nearby
   */
  useExcavationTool(toolId) {
    const nearbyPOI = this.findNearbyPOI();

    if (!nearbyPOI) {
      return false;
    }

    // Start tool animation
    this.startToolAnimation(toolId);

    // Get artifact and check if tool is correct
    const artifact = getArtifact(nearbyPOI.artifact.id);
    if (!artifact) {
      console.error('Invalid artifact ID:', nearbyPOI.artifact.id);
      return true;
    }

    const isCorrectTool = artifact.toolRequired === toolId;

    // Schedule outcome after animation completes
    setTimeout(() => {
      this.handleExcavationOutcome(nearbyPOI, artifact, isCorrectTool);
    }, this.TOOL_ANIMATION_DURATION);

    return true;
  }

  /**
   * Start tool animation
   * Blocks movement during animation
   * @param {string} toolId - ID of the tool to animate
   */
  startToolAnimation(toolId) {
    const animationState = this.toolAnimationMap[toolId];
    if (!animationState) {
      console.error('Unknown tool animation:', toolId);
      return;
    }

    this.isAnimating = true;
    this.animationStartTime = performance.now();
    if (this.animator) {
      this.animator.setState(animationState, this.gameState.player.direction);
    }
  }

  /**
   * Handle the outcome of excavation tool use
   * @param {Object} poi - POI being excavated
   * @param {Object} artifact - Artifact at the POI
   * @param {boolean} isCorrectTool - Whether correct tool was used
   */
  handleExcavationOutcome(poi, artifact, isCorrectTool) {
    if (isCorrectTool) {
      // Correct tool: Success!
      this.handleCorrectTool(poi, artifact);
    } else {
      // Wrong tool: Increment attempts and handle failure
      this.handleWrongTool(poi);
    }
  }

  /**
   * Handle correct tool usage
   * - Play confetti effect
   * - Add artifact to inventory
   * - Remove POI from level
   * - Update hint text
   * @param {Object} poi - POI being excavated
   * @param {Object} artifact - Artifact extracted
   */
  handleCorrectTool(poi, artifact) {
    // Play confetti at POI location (convert tile coords to world pixels)
    const worldX = poi.position.x * 40 + 20;
    const worldY = poi.position.y * 40 + 20;
    this.confettiSystem.emit(worldX, worldY, 40);

    // Add artifact to player artifacts collection
    if (!this.gameState.player.artifacts) {
      this.gameState.player.artifacts = [];
    }
    this.gameState.player.artifacts.push(artifact.id);

    // Remove POI from level
    this.removePOI(poi);

    // Show success message
    this.hintText = `Found: ${artifact.name}`;
    this.hintStartTime = performance.now();

    console.log('Artifact extracted:', artifact.name);
  }

  /**
   * Handle wrong tool usage
   * - First attempt: Red flash, increment wrongAttempts
   * - Second attempt: Remove POI permanently, no artifact
   * @param {Object} poi - POI being excavated
   */
  handleWrongTool(poi) {
    // Trigger red flash effect
    this.flashEffect.trigger();

    // Increment wrong attempts (initialize if needed)
    if (!poi.wrongAttempts) {
      poi.wrongAttempts = 0;
    }
    poi.wrongAttempts++;

    if (poi.wrongAttempts >= 2) {
      // Second wrong attempt: Remove POI permanently
      this.removePOI(poi);
      this.hintText = 'Site damaged beyond recovery';
      this.hintStartTime = performance.now();
      console.log('POI removed due to 2 wrong attempts');
    } else {
      // First wrong attempt: Warning
      this.hintText = 'Wrong tool! Try a different approach';
      this.hintStartTime = performance.now();
      console.log('Wrong tool used, attempts:', poi.wrongAttempts);
    }
  }

  /**
   * Find POI within 1 tile of player position
   * @returns {Object|null} Nearby POI or null if none found
   */
  findNearbyPOI() {
    const playerTileX = Math.floor(this.gameState.player.position.x / 40);
    const playerTileY = Math.floor(this.gameState.player.position.y / 40);

    // Check all POIs in level
    for (const poi of this.gameState.level.pois) {
      // POIs already stored in tile coordinates
      const poiTileX = poi.position.x;
      const poiTileY = poi.position.y;

      // Check if within 1 tile distance (Manhattan distance)
      const dx = Math.abs(playerTileX - poiTileX);
      const dy = Math.abs(playerTileY - poiTileY);

      if (dx <= 1 && dy <= 1) {
        return poi;
      }
    }

    return null;
  }

  /**
   * Remove POI from level
   * @param {Object} poi - POI to remove
   */
  removePOI(poi) {
    const index = this.gameState.level.pois.indexOf(poi);
    if (index !== -1) {
      this.gameState.level.pois.splice(index, 1);
    }
  }

  /**
   * Check if tool is an excavation tool
   * @param {string} toolId - Tool ID to check
   * @returns {boolean} True if excavation tool
   */
  isExcavationTool(toolId) {
    return toolId === 'shovel' ||
           toolId === 'pickaxe' ||
           toolId === 'brush' ||
           toolId === 'hammer_chisel';
  }

  /**
   * Check if tool system is currently animating
   * Used to block player movement during animations
   * @returns {boolean} True if animation is playing
   */
  isToolAnimating() {
    return this.isAnimating;
  }

  /**
   * Get current hint text (for UI rendering)
   * @returns {string|null} Current hint text or null if none
   */
  getHintText() {
    return this.hintText;
  }

  /**
   * Clear current hint text
   */
  clearHint() {
    this.hintText = null;
  }

  /**
   * Render hint text as dialog box
   * Should be called from the UI rendering layer
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} canvasWidth - Width of canvas
   * @param {number} canvasHeight - Height of canvas
   */
  renderHint(ctx, canvasWidth, canvasHeight) {
    if (!this.hintText) return;

    // Calculate fade based on remaining time
    const elapsed = performance.now() - this.hintStartTime;
    const remaining = this.hintDuration - elapsed;
    let alpha = 1;

    // Fade out in last 500ms
    if (remaining < 500) {
      alpha = remaining / 500;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw semi-transparent overlay backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Dialog box dimensions
    const dialogWidth = 600;
    const dialogHeight = 150;
    const dialogX = (canvasWidth - dialogWidth) / 2;
    const dialogY = (canvasHeight - dialogHeight) / 2;

    // Draw dialog box background
    ctx.fillStyle = 'rgba(40, 40, 40, 0.95)';
    ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);

    // Draw dialog box border
    ctx.strokeStyle = '#FFD700'; // Gold border
    ctx.lineWidth = 4;
    ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

    // Draw message text
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = canvasWidth / 2;
    const textY = canvasHeight / 2;

    // Word wrap for long messages
    const words = this.hintText.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > dialogWidth - 40) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Draw each line centered
    const lineHeight = 32;
    const totalHeight = lines.length * lineHeight;
    let startY = textY - totalHeight / 2 + lineHeight / 2;

    for (const line of lines) {
      ctx.fillText(line, textX, startY);
      startY += lineHeight;
    }

    ctx.restore();
  }
}
