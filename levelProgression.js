/**
 * Level Progression System
 *
 * Handles:
 * - Detecting when all 15 POIs are processed (collected or destroyed)
 * - Showing "Level Complete" modal
 * - Transitioning to museum screen
 * - Regenerating map for next level with new seed
 * - Special handling for Level 10 completion (confetti, congratulations)
 * - Resetting inventory (keeping tools and money)
 *
 * Architecture:
 * - Monitors POI completion status
 * - Coordinates between game loop, museum, and level generation
 * - Level number used as seed for reproducible generation
 */

class LevelProgression {
  constructor() {
    // Reference to game state
    this.gameState = null;

    // Reference to museum system
    this.museum = null;

    // Reference to level generator
    this.levelGenerator = null;

    // Confetti system for Level 10 completion
    this.confettiSystem = null;

    // UI elements
    this.levelCompleteModal = null;
    this.congratulationsModal = null;

    // Callbacks
    this.onLevelRegenerate = null;

    // Collected artifacts for current level
    this.collectedArtifacts = [];
  }

  /**
   * Initialize level progression system
   * @param {Object} gameState - Current game state
   * @param {Museum} museum - Museum system reference
   * @param {Function} onLevelRegenerate - Callback when level needs regeneration
   */
  initialize(gameState, museum, onLevelRegenerate) {
    this.gameState = gameState;
    this.museum = museum;
    this.onLevelRegenerate = onLevelRegenerate;

    // Initialize confetti system
    this.confettiSystem = new ConfettiSystem();

    // Create UI elements
    this.createLevelCompleteModal();
    this.createCongratulationsModal();

    // Bind museum callback
    if (this.museum) {
      this.museum.initialize(this.gameState, () => this.progressToNextLevel());
    }

    console.log('Level progression system initialized');
  }

  /**
   * Check if level is complete (all POIs processed)
   * @returns {boolean} True if all POIs are processed
   */
  isLevelComplete() {
    if (!this.gameState || !this.gameState.level.pois) {
      return false;
    }

    const totalPOIs = 15; // As per requirements
    const currentPOIs = this.gameState.level.pois.length;

    // Level is complete when all POIs are removed (collected or destroyed)
    return currentPOIs === 0 || this.gameState.level.pois.every(poi => poi.processed);
  }

  /**
   * Register artifact collection
   * Called when player successfully extracts an artifact
   * @param {string} artifactId - ID of collected artifact
   */
  collectArtifact(artifactId) {
    if (!this.collectedArtifacts.includes(artifactId)) {
      this.collectedArtifacts.push(artifactId);
    }
    console.log(`Collected artifact: ${artifactId}`);
  }

  /**
   * Trigger level completion sequence
   * Called when all POIs are processed
   */
  completeLeve() {
    console.log(`Level ${this.gameState.level.number} complete`);

    // Save game state
    saveGameState(this.gameState);

    // Show level complete modal
    this.showLevelCompleteModal();
  }

  /**
   * Create Level Complete modal
   * @private
   */
  createLevelCompleteModal() {
    this.levelCompleteModal = document.createElement('div');
    this.levelCompleteModal.id = 'level-complete-modal';
    this.levelCompleteModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 900;
      color: white;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'text-align: center;';

    const title = document.createElement('h1');
    title.textContent = 'Level Complete!';
    title.style.cssText = 'font-size: 64px; margin-bottom: 30px; color: #FFD700;';
    content.appendChild(title);

    const message = document.createElement('p');
    message.id = 'level-complete-message';
    message.style.cssText = 'font-size: 24px; margin-bottom: 40px;';
    content.appendChild(message);

    const button = document.createElement('button');
    button.textContent = 'View Museum';
    button.style.cssText = `
      padding: 15px 40px;
      font-size: 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    button.onmouseover = () => button.style.background = '#45a049';
    button.onmouseout = () => button.style.background = '#4CAF50';
    button.onclick = () => this.transitionToMuseum();
    content.appendChild(button);

    this.levelCompleteModal.appendChild(content);
    document.body.appendChild(this.levelCompleteModal);
  }

  /**
   * Create Congratulations modal (for Level 10 completion)
   * @private
   */
  createCongratulationsModal() {
    this.congratulationsModal = document.createElement('div');
    this.congratulationsModal.id = 'congratulations-modal';
    this.congratulationsModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 950;
      color: white;
      font-family: Arial, sans-serif;
    `;

    // Canvas for confetti
    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'congratulations-confetti';
    confettiCanvas.width = 1440;
    confettiCanvas.height = 960;
    confettiCanvas.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none;';
    this.congratulationsModal.appendChild(confettiCanvas);

    const content = document.createElement('div');
    content.style.cssText = 'text-align: center; z-index: 951; position: relative;';

    const title = document.createElement('h1');
    title.textContent = 'Congratulations!';
    title.style.cssText = 'font-size: 72px; margin-bottom: 20px; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);';
    content.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.textContent = 'You completed the Roman Island!';
    subtitle.style.cssText = 'font-size: 36px; margin-bottom: 40px; color: #87CEEB;';
    content.appendChild(subtitle);

    const nextIsland = document.createElement('p');
    nextIsland.textContent = 'Next Island Unlocked (Coming Soon)';
    nextIsland.style.cssText = 'font-size: 24px; margin-bottom: 40px; color: #888; font-style: italic;';
    content.appendChild(nextIsland);

    const button = document.createElement('button');
    button.textContent = 'View Museum';
    button.style.cssText = `
      padding: 15px 40px;
      font-size: 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    button.onmouseover = () => button.style.background = '#45a049';
    button.onmouseout = () => button.style.background = '#4CAF50';
    button.onclick = () => this.transitionToMuseum();
    content.appendChild(button);

    this.congratulationsModal.appendChild(content);
    document.body.appendChild(this.congratulationsModal);
  }

  /**
   * Show level complete modal
   * @private
   */
  showLevelCompleteModal() {
    const message = document.getElementById('level-complete-message');
    if (message) {
      message.textContent = `You collected ${this.collectedArtifacts.length} artifacts on Level ${this.gameState.level.number}`;
    }

    // Check if Level 10 - show congratulations instead
    if (this.gameState.level.number === 10) {
      this.showCongratulationsModal();
    } else {
      this.levelCompleteModal.style.display = 'flex';
    }
  }

  /**
   * Show congratulations modal with confetti
   * @private
   */
  showCongratulationsModal() {
    this.congratulationsModal.style.display = 'flex';

    // Trigger confetti
    this.confettiSystem.emit(720, 480, 100); // Center of screen

    // Animate confetti
    this.animateConfetti();
  }

  /**
   * Animate confetti particles
   * @private
   */
  animateConfetti() {
    const canvas = document.getElementById('congratulations-confetti');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and render confetti
      this.confettiSystem.update(deltaTime);
      this.confettiSystem.render(ctx);

      // Continue animation if confetti is active
      if (this.confettiSystem.isActive()) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Transition to museum screen
   * @private
   */
  transitionToMuseum() {
    // Hide modals
    if (this.levelCompleteModal) {
      this.levelCompleteModal.style.display = 'none';
    }
    if (this.congratulationsModal) {
      this.congratulationsModal.style.display = 'none';
    }

    // Show museum with collected artifacts
    if (this.museum) {
      this.museum.show(this.collectedArtifacts);
    }
  }

  /**
   * Progress to next level
   * Called after museum donation
   * @private
   */
  progressToNextLevel() {
    // Increment level number
    const nextLevel = this.gameState.level.number + 1;

    // Check if all levels complete (Level 10 is the last level)
    if (nextLevel > 10) {
      console.log('All levels complete! Game finished.');
      // For now, just reset to level 1 or show end screen
      // TODO: Implement next island selection when multiple islands are added
      this.gameState.level.number = 1;
    } else {
      this.gameState.level.number = nextLevel;
    }

    // Update inventory for new level
    updateInventoryForLevel(this.gameState, this.gameState.level.number);

    // Clear collected artifacts for new level
    this.collectedArtifacts = [];

    // Save game state
    saveGameState(this.gameState);

    // Regenerate level with new seed (level number as seed)
    this.regenerateLevel();

    console.log(`Progressing to Level ${this.gameState.level.number}`);
  }

  /**
   * Regenerate level with new seed
   * Uses level number as seed for reproducible generation
   * @private
   */
  regenerateLevel() {
    // Level number as seed for reproducibility
    const seed = this.gameState.level.number;

    // Trigger level regeneration callback
    if (this.onLevelRegenerate) {
      this.onLevelRegenerate(this.gameState.level.number, seed);
    }

    // Reset player position (will be set by level generator)
    // Keep money and tools

    console.log(`Level ${this.gameState.level.number} generated with seed: ${seed}`);
  }

  /**
   * Update confetti system (called from game loop if needed)
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    if (this.confettiSystem && this.confettiSystem.isActive()) {
      this.confettiSystem.update(deltaTime);
    }
  }

  /**
   * Render confetti (called from game loop if needed)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (this.confettiSystem && this.confettiSystem.isActive()) {
      this.confettiSystem.render(ctx);
    }
  }

  /**
   * Reset level progression for new level
   * Clears collected artifacts
   */
  reset() {
    this.collectedArtifacts = [];
    console.log('Level progression reset for new level');
  }

  /**
   * Cleanup level progression resources
   */
  destroy() {
    if (this.levelCompleteModal && this.levelCompleteModal.parentNode) {
      this.levelCompleteModal.parentNode.removeChild(this.levelCompleteModal);
    }
    if (this.congratulationsModal && this.congratulationsModal.parentNode) {
      this.congratulationsModal.parentNode.removeChild(this.congratulationsModal);
    }

    this.levelCompleteModal = null;
    this.congratulationsModal = null;
    this.gameState = null;
    this.museum = null;
    this.confettiSystem = null;
    this.onLevelRegenerate = null;
    this.collectedArtifacts = [];
  }
}
