/**
 * Tutorial System
 * Manages Level 1 tutorial overlay display and localStorage flag tracking
 *
 * Shows tutorial on first game start with instructions for:
 * 1. Movement (WASD)
 * 2. Finding POI markers
 * 3. Using magnifying glass for hints
 * 4. Using correct tool for extraction
 *
 * Tutorial dismisses after first successful artifact extraction
 * Only shows once per browser (localStorage flag: 'archeology_tutorial_completed')
 */

// LocalStorage key for tutorial completion tracking
const TUTORIAL_STORAGE_KEY = 'archeology_tutorial_completed';

/**
 * Tutorial instruction steps
 * @typedef {Object} TutorialStep
 * @property {number} step - Step number (1-4)
 * @property {string} text - Instruction text to display
 */

/**
 * Tutorial steps displayed in overlay
 * @type {TutorialStep[]}
 */
const TUTORIAL_STEPS = [
  {
    step: 1,
    text: 'Use WASD keys to move and explore the map'
  },
  {
    step: 2,
    text: 'Find glowing golden POI markers scattered across the level'
  },
  {
    step: 3,
    text: 'Click tool icons at bottom center to select tools (MAG = magnifying glass)'
  },
  {
    step: 4,
    text: 'Available tools: ROD (mapping), MAG (hints), SHV (shovel) for excavation'
  },
  {
    step: 5,
    text: 'Stand near a POI and press SPACEBAR to use your selected tool'
  },
  {
    step: 6,
    text: 'Press I to open your artifact inventory and view collected items'
  }
];

/**
 * Tutorial overlay manager
 * Handles creation, display, and dismissal of tutorial UI
 */
class TutorialManager {
  constructor() {
    /** @type {HTMLElement | null} */
    this.overlayElement = null;

    /** @type {boolean} */
    this.isShowing = false;
  }

  /**
   * Check if tutorial has been completed before
   * @returns {boolean} True if tutorial was previously completed
   */
  hasCompletedTutorial() {
    try {
      const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Failed to check tutorial completion status:', error);
      throw new Error(`Tutorial localStorage read failed: ${error.message}`);
    }
  }

  /**
   * Mark tutorial as completed in localStorage
   * @throws {Error} If localStorage write fails
   */
  markTutorialCompleted() {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      console.log('Tutorial marked as completed');
    } catch (error) {
      console.error('Failed to save tutorial completion status:', error);
      throw new Error(`Tutorial localStorage write failed: ${error.message}`);
    }
  }

  /**
   * Check if tutorial should be shown
   * Shows on Level 1 if not previously completed
   * @param {number} levelNumber - Current level number
   * @returns {boolean} True if tutorial should be shown
   */
  shouldShowTutorial(levelNumber) {
    if (levelNumber !== 1) {
      return false;
    }

    return !this.hasCompletedTutorial();
  }

  /**
   * Create tutorial overlay DOM element
   * @returns {HTMLElement} Tutorial overlay element
   * @throws {Error} If DOM element creation fails
   */
  createOverlayElement() {
    try {
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'tutorial-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;

      // Create tutorial content box
      const contentBox = document.createElement('div');
      contentBox.style.cssText = `
        background-color: #2a1810;
        border: 4px solid #8b6f47;
        border-radius: 8px;
        padding: 30px 40px;
        max-width: 600px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
      `;

      // Create title
      const title = document.createElement('h2');
      title.textContent = 'Welcome, Archaeologist!';
      title.style.cssText = `
        color: #f4e4c1;
        font-family: Georgia, serif;
        font-size: 32px;
        margin: 0 0 20px 0;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      `;
      contentBox.appendChild(title);

      // Create instructions list
      const instructionsList = document.createElement('ol');
      instructionsList.style.cssText = `
        color: #f4e4c1;
        font-family: Arial, sans-serif;
        font-size: 18px;
        line-height: 1.8;
        margin: 0 0 30px 0;
        padding-left: 30px;
      `;

      // Add each tutorial step
      TUTORIAL_STEPS.forEach((stepData) => {
        const listItem = document.createElement('li');
        listItem.textContent = stepData.text;
        listItem.style.cssText = `
          margin-bottom: 10px;
        `;
        instructionsList.appendChild(listItem);
      });
      contentBox.appendChild(instructionsList);

      // Create dismiss button
      const dismissButton = document.createElement('button');
      dismissButton.textContent = 'Begin Expedition';
      dismissButton.style.cssText = `
        background-color: #8b6f47;
        color: #f4e4c1;
        font-family: Georgia, serif;
        font-size: 20px;
        font-weight: bold;
        border: 3px solid #f4e4c1;
        border-radius: 4px;
        padding: 12px 30px;
        cursor: pointer;
        display: block;
        margin: 0 auto;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        transition: all 0.2s;
      `;

      // Button hover effect
      dismissButton.addEventListener('mouseenter', () => {
        dismissButton.style.backgroundColor = '#a68a5a';
        dismissButton.style.transform = 'translateY(-2px)';
        dismissButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.6)';
      });

      dismissButton.addEventListener('mouseleave', () => {
        dismissButton.style.backgroundColor = '#8b6f47';
        dismissButton.style.transform = 'translateY(0)';
        dismissButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
      });

      // Attach dismiss handler
      dismissButton.addEventListener('click', () => {
        this.dismissTutorial();
      });

      contentBox.appendChild(dismissButton);
      overlay.appendChild(contentBox);

      return overlay;
    } catch (error) {
      console.error('Failed to create tutorial overlay element:', error);
      throw new Error(`Tutorial DOM creation failed: ${error.message}`);
    }
  }

  /**
   * Show tutorial overlay
   * Blocks game interaction until dismissed
   * @throws {Error} If overlay creation or display fails
   */
  showTutorial() {
    if (this.isShowing) {
      console.warn('Tutorial is already showing');
      return;
    }

    try {
      // Create and append overlay to document body
      this.overlayElement = this.createOverlayElement();
      document.body.appendChild(this.overlayElement);
      this.isShowing = true;

      console.log('Tutorial overlay displayed');
    } catch (error) {
      console.error('Failed to show tutorial:', error);
      throw new Error(`Tutorial display failed: ${error.message}`);
    }
  }

  /**
   * Dismiss tutorial overlay
   * Removes overlay from DOM but does NOT mark as completed
   * @throws {Error} If overlay removal fails
   */
  dismissTutorial() {
    if (!this.isShowing || !this.overlayElement) {
      console.warn('No tutorial overlay to dismiss');
      return;
    }

    try {
      // Remove overlay from DOM
      this.overlayElement.remove();
      this.overlayElement = null;
      this.isShowing = false;

      console.log('Tutorial overlay dismissed');
    } catch (error) {
      console.error('Failed to dismiss tutorial:', error);
      throw new Error(`Tutorial dismissal failed: ${error.message}`);
    }
  }

  /**
   * Handle successful artifact extraction
   * Marks tutorial as completed after first successful extraction
   * @throws {Error} If marking completion fails
   */
  onArtifactExtracted() {
    if (this.hasCompletedTutorial()) {
      return;
    }

    try {
      this.markTutorialCompleted();
      console.log('Tutorial completed after first artifact extraction');
    } catch (error) {
      console.error('Failed to mark tutorial as completed:', error);
      throw new Error(`Tutorial completion tracking failed: ${error.message}`);
    }
  }

  /**
   * Reset tutorial completion (for testing/debugging)
   * @throws {Error} If localStorage clear fails
   */
  resetTutorial() {
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
      console.log('Tutorial completion status reset');
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
      throw new Error(`Tutorial reset failed: ${error.message}`);
    }
  }
}

/**
 * Global error handler for tutorial system
 * Logs error and re-throws to ensure visibility
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 * @throws {Error} Always re-throws the error
 */
function handleTutorialError(context, error) {
  const errorMessage = `Tutorial error in ${context}: ${error.message}`;
  console.error(errorMessage, error);
  throw new Error(errorMessage);
}
