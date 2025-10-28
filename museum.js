/**
 * Museum Screen and Artifact Management
 *
 * Handles:
 * - Displaying collected artifacts from player inventory (icons only, no names/descriptions)
 * - Donating artifacts to permanent museum collection
 * - Showing donated artifact details (name, description) in museum collection
 * - Calculating and awarding money for donations ($100 per valuable, $0-10 per junk)
 * - Progression to next level
 *
 * Architecture:
 * - Museum state persists across levels (gameState.museum.collection)
 * - Inventory artifacts are temporary until donated
 * - After donation, artifacts move from inventory to museum collection
 * - Museum only displays donated items with full details
 */

class Museum {
  constructor() {
    // Reference to museum container element
    this.container = null;

    // Current game state reference
    this.gameState = null;

    // Callbacks for museum actions
    this.onContinueToNextLevel = null;

    // Track temporary inventory artifacts (collected but not donated)
    this.tempInventoryArtifacts = [];
  }

  /**
   * Initialize museum with game state
   * @param {Object} gameState - Current game state
   * @param {Function} onContinueToNextLevel - Callback when player continues to next level
   */
  initialize(gameState, onContinueToNextLevel) {
    this.gameState = gameState;
    this.onContinueToNextLevel = onContinueToNextLevel;
  }

  /**
   * Show museum screen
   * Called after level completion
   * @param {string[]} collectedArtifacts - Array of artifact IDs collected this level
   */
  show(collectedArtifacts) {
    this.tempInventoryArtifacts = collectedArtifacts || [];

    // Create museum container if it doesn't exist
    if (!this.container) {
      this.createMuseumContainer();
    }

    // Render museum content
    this.render();

    // Show the container
    this.container.style.display = 'flex';
  }

  /**
   * Hide museum screen
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Create museum DOM container
   * @private
   */
  createMuseumContainer() {
    this.container = document.createElement('div');
    this.container.id = 'museum-screen';
    this.container.style.cssText = `
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
      z-index: 1000;
      color: white;
      font-family: Arial, sans-serif;
    `;

    document.body.appendChild(this.container);
  }

  /**
   * Render museum content
   * Shows collected artifacts (icons only) and donated artifacts (with details)
   * @private
   */
  render() {
    if (!this.container) return;

    // Clear existing content
    this.container.innerHTML = '';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Museum';
    title.style.cssText = 'margin-bottom: 30px; font-size: 48px;';
    this.container.appendChild(title);

    // Main content container
    const content = document.createElement('div');
    content.style.cssText = 'max-width: 1200px; width: 90%;';
    this.container.appendChild(content);

    // Section 1: Collected Artifacts (not yet donated)
    if (this.tempInventoryArtifacts.length > 0) {
      const collectedSection = document.createElement('div');
      collectedSection.style.cssText = 'margin-bottom: 40px;';

      const collectedTitle = document.createElement('h2');
      collectedTitle.textContent = 'Artifacts Collected This Level';
      collectedTitle.style.cssText = 'margin-bottom: 20px; font-size: 28px; color: #FFD700;';
      collectedSection.appendChild(collectedTitle);

      const collectedGrid = this.createArtifactGrid(this.tempInventoryArtifacts, false);
      collectedSection.appendChild(collectedGrid);

      // Donate All button
      const donateButton = document.createElement('button');
      donateButton.textContent = 'Donate All';
      donateButton.style.cssText = `
        margin-top: 20px;
        padding: 15px 40px;
        font-size: 24px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
      `;
      donateButton.onmouseover = () => donateButton.style.background = '#45a049';
      donateButton.onmouseout = () => donateButton.style.background = '#4CAF50';
      donateButton.onclick = () => this.donateAllArtifacts();
      collectedSection.appendChild(donateButton);

      content.appendChild(collectedSection);
    }

    // Section 2: Museum Collection (donated artifacts)
    const museumSection = document.createElement('div');
    museumSection.style.cssText = 'margin-bottom: 40px;';

    const museumTitle = document.createElement('h2');
    museumTitle.textContent = 'Museum Collection';
    museumTitle.style.cssText = 'margin-bottom: 20px; font-size: 28px; color: #87CEEB;';
    museumSection.appendChild(museumTitle);

    if (this.gameState.museum.collection.length > 0) {
      const museumGrid = this.createArtifactGrid(this.gameState.museum.collection, true);
      museumSection.appendChild(museumGrid);
    } else {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No artifacts donated yet. Donate artifacts to see them in your collection!';
      emptyMessage.style.cssText = 'color: #888; font-size: 18px;';
      museumSection.appendChild(emptyMessage);
    }

    content.appendChild(museumSection);

    // Continue to Next Level button (only show after donation or if no artifacts collected)
    if (this.tempInventoryArtifacts.length === 0) {
      const continueButton = document.createElement('button');
      continueButton.textContent = 'Continue to Next Level';
      continueButton.style.cssText = `
        margin-top: 30px;
        padding: 15px 40px;
        font-size: 24px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
      `;
      continueButton.onmouseover = () => continueButton.style.background = '#1976D2';
      continueButton.onmouseout = () => continueButton.style.background = '#2196F3';
      continueButton.onclick = () => this.continueToNextLevel();
      content.appendChild(continueButton);
    }
  }

  /**
   * Create artifact grid display
   * @param {string[]} artifactIds - Array of artifact IDs
   * @param {boolean} showDetails - Whether to show artifact names/descriptions
   * @returns {HTMLElement} Grid container
   * @private
   */
  createArtifactGrid(artifactIds, showDetails) {
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    `;

    artifactIds.forEach(artifactId => {
      const artifact = getArtifact(artifactId);
      if (!artifact) return;

      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: ${showDetails ? 'pointer' : 'default'};
        transition: background 0.3s;
      `;

      if (showDetails) {
        item.onmouseover = () => item.style.background = 'rgba(255, 255, 255, 0.2)';
        item.onmouseout = () => item.style.background = 'rgba(255, 255, 255, 0.1)';
      }

      // Artifact icon (simple colored circle based on artifact type)
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.getArtifactColor(artifact)};
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
      `;
      icon.textContent = this.getArtifactEmoji(artifact);
      item.appendChild(icon);

      // Artifact details (only if donated)
      if (showDetails) {
        const name = document.createElement('div');
        name.textContent = artifact.name;
        name.style.cssText = 'font-weight: bold; text-align: center; margin-bottom: 5px; font-size: 14px;';
        item.appendChild(name);

        const description = document.createElement('div');
        description.textContent = artifact.description;
        description.style.cssText = 'font-size: 11px; text-align: center; color: #ccc; line-height: 1.3;';
        item.appendChild(description);

        const value = document.createElement('div');
        value.textContent = `$${artifact.value}`;
        value.style.cssText = 'font-size: 12px; color: #FFD700; margin-top: 5px; font-weight: bold;';
        item.appendChild(value);
      } else {
        const mystery = document.createElement('div');
        mystery.textContent = '???';
        mystery.style.cssText = 'font-size: 18px; color: #888;';
        item.appendChild(mystery);
      }

      grid.appendChild(item);
    });

    return grid;
  }

  /**
   * Get color for artifact icon based on type
   * @param {Object} artifact - Artifact data
   * @returns {string} CSS color
   * @private
   */
  getArtifactColor(artifact) {
    if (artifact.isJunk) {
      return '#8B4513'; // brown for junk
    }

    // Color based on tool required
    switch (artifact.toolRequired) {
      case 'shovel': return '#D2691E'; // chocolate
      case 'pickaxe': return '#708090'; // slate gray
      case 'brush': return '#FFD700'; // gold
      case 'hammer_chisel': return '#C0C0C0'; // silver
      default: return '#888888';
    }
  }

  /**
   * Get emoji representation for artifact
   * @param {Object} artifact - Artifact data
   * @returns {string} Emoji character
   * @private
   */
  getArtifactEmoji(artifact) {
    const emojiMap = {
      amphora: '🏺',
      denarius_coin: '🪙',
      mosaic_tile: '🎨',
      oil_lamp: '🪔',
      fibula: '📌',
      strigil: '🔧',
      signet_ring: '💍',
      fresco_fragment: '🖼️',
      gladius_pommel: '⚔️',
      votive_statue: '🗿',
      broken_pottery: '🪨',
      corroded_nail: '🔩',
      stone_fragment: '🪨',
      animal_bone: '🦴',
      weathered_brick: '🧱'
    };

    return emojiMap[artifact.id] || '❓';
  }

  /**
   * Donate all collected artifacts to museum
   * Transfers artifacts from temp inventory to permanent collection
   * Awards money based on artifact values
   * @private
   */
  donateAllArtifacts() {
    if (this.tempInventoryArtifacts.length === 0) return;

    let totalMoney = 0;

    // Process each artifact
    this.tempInventoryArtifacts.forEach(artifactId => {
      const artifact = getArtifact(artifactId);
      if (!artifact) return;

      // Add to museum collection (avoid duplicates for display purposes)
      if (!this.gameState.museum.collection.includes(artifactId)) {
        this.gameState.museum.collection.push(artifactId);
      }

      // Calculate money
      if (artifact.isJunk) {
        // Junk items have fixed values in the catalog (0-10)
        totalMoney += artifact.value;
      } else {
        // Valuable artifacts worth $100
        totalMoney += 100;
      }
    });

    // Add money to player
    this.gameState.player.money += totalMoney;

    // Clear temporary inventory
    this.tempInventoryArtifacts = [];

    // Save game state after donation
    saveGameState(this.gameState);

    // Re-render museum to show updated state
    this.render();

    console.log(`Donated artifacts for $${totalMoney}. Total money: $${this.gameState.player.money}`);
  }

  /**
   * Continue to next level
   * Hides museum and triggers level progression callback
   * @private
   */
  continueToNextLevel() {
    this.hide();

    if (this.onContinueToNextLevel) {
      this.onContinueToNextLevel();
    }
  }

  /**
   * Cleanup museum resources
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.gameState = null;
    this.onContinueToNextLevel = null;
    this.tempInventoryArtifacts = [];
  }
}
