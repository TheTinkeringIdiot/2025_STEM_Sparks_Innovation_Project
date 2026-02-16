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
   * Shows collected artifacts with funding summary
   * @private
   */
  render() {
    if (!this.container) return;

    // Clear existing content
    this.container.innerHTML = '';

    // Calculate funding from collected artifacts
    let totalFunding = 0;
    this.tempInventoryArtifacts.forEach(artifactId => {
      const artifact = getArtifact(artifactId);
      if (artifact) {
        totalFunding += artifact.value;
      }
    });

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Level Complete!';
    title.style.cssText = `
      margin-bottom: 10px;
      font-size: 48px;
      font-family: Georgia, serif;
      color: #f4e4c1;
    `;
    this.container.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'Artifacts Donated to Museum';
    subtitle.style.cssText = `
      margin-bottom: 30px;
      font-size: 24px;
      color: #a0a0a0;
      font-weight: normal;
    `;
    this.container.appendChild(subtitle);

    // Main content container
    const content = document.createElement('div');
    content.style.cssText = 'max-width: 900px; width: 90%;';
    this.container.appendChild(content);

    // Artifacts collected section
    if (this.tempInventoryArtifacts.length > 0) {
      const collectedGrid = this.createArtifactGrid(this.tempInventoryArtifacts, true);
      content.appendChild(collectedGrid);
    } else {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No artifacts were collected this level.';
      emptyMessage.style.cssText = 'color: #888; font-size: 20px; text-align: center; margin: 40px 0;';
      content.appendChild(emptyMessage);
    }

    // Funding summary
    const fundingSection = document.createElement('div');
    fundingSection.style.cssText = `
      margin-top: 30px;
      padding: 20px 30px;
      background: rgba(255, 215, 0, 0.1);
      border: 2px solid #FFD700;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const fundingLabel = document.createElement('div');
    fundingLabel.innerHTML = `
      <div style="font-size: 18px; color: #a0a0a0;">Museum Funding Received</div>
      <div style="font-size: 14px; color: #666; margin-top: 5px;">${this.tempInventoryArtifacts.length} artifact${this.tempInventoryArtifacts.length !== 1 ? 's' : ''} donated</div>
    `;
    fundingSection.appendChild(fundingLabel);

    const fundingAmount = document.createElement('div');
    fundingAmount.textContent = `+$${totalFunding}`;
    fundingAmount.style.cssText = `
      font-size: 36px;
      font-weight: bold;
      color: #FFD700;
      font-family: monospace;
    `;
    fundingSection.appendChild(fundingAmount);

    content.appendChild(fundingSection);

    // Continue button
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue to Next Level';
    continueButton.style.cssText = `
      margin-top: 30px;
      padding: 18px 50px;
      font-size: 24px;
      background: #8b6f47;
      color: #f4e4c1;
      border: 3px solid #f4e4c1;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: Georgia, serif;
    `;
    continueButton.onmouseover = () => {
      continueButton.style.background = '#a68a5a';
      continueButton.style.transform = 'translateY(-2px)';
    };
    continueButton.onmouseout = () => {
      continueButton.style.background = '#8b6f47';
      continueButton.style.transform = 'translateY(0)';
    };
    continueButton.onclick = () => this.donateAndContinue();
    content.appendChild(continueButton);
  }

  /**
   * Donate artifacts and continue to next level
   * Adds funding to player wallet and proceeds
   * @private
   */
  donateAndContinue() {
    // Calculate and add funding to player wallet
    let totalFunding = 0;
    this.tempInventoryArtifacts.forEach(artifactId => {
      const artifact = getArtifact(artifactId);
      if (artifact) {
        totalFunding += artifact.value;

        // Add to museum collection (avoid duplicates)
        if (!this.gameState.museum.collection.includes(artifactId)) {
          this.gameState.museum.collection.push(artifactId);
        }
      }
    });

    // Add funding to player wallet
    this.gameState.player.money += totalFunding;

    // Clear temporary artifacts
    this.tempInventoryArtifacts = [];

    // Save game state
    saveGameState(this.gameState);

    console.log(`Museum funding: +$${totalFunding}. Total wallet: $${this.gameState.player.money}`);

    // Continue to next level
    this.continueToNextLevel();
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
      weathered_brick: '🧱',
      // Level 2 artifacts
      bronze_speculum: '🪞',
      garum_amphora: '🏺',
      lead_curse_tablet: '📜',
      terracotta_figurine: '🗿',
      sestertius_coin: '🪙',
      roman_glass_vessel: '🫗',
      pilum_tip: '🔱',
      tegula_legion_stamp: '🧱',
      roof_tile_fragment: '🧱',
      iron_slag: '⚫',
      charcoal_remnants: '⚫'
    };

    return emojiMap[artifact.id] || '❓';
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
