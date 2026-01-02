/**
 * Tool Information Sidebar
 *
 * Displays educational information about the currently selected tool.
 * Shows tool name, description, and archaeological use/benefits.
 */

const TOOL_INFO = {
  stadia_rod: {
    name: 'Stadia Rod',
    icon: '📏',
    description: 'A graduated measuring rod used in surveying and archaeological excavations.',
    archaeologyUse: 'Stadia rods help archaeologists accurately measure distances and elevations across a dig site. Combined with a transit or theodolite, they enable precise mapping of artifact locations and stratigraphy layers.',
    benefits: [
      'Creates accurate site maps',
      'Records vertical depth of finds',
      'Establishes reference points for excavation grids'
    ],
    historicalNote: 'The stadia method dates back to ancient Greece, where it was used for land surveying and construction projects like the Parthenon.'
  },
  magnifying_glass: {
    name: 'Magnifying Glass',
    icon: '🔍',
    description: 'An optical lens that provides visual magnification for close inspection.',
    archaeologyUse: 'Magnifying glasses allow archaeologists to examine fine details on artifacts without touching them. They help identify maker\'s marks, inscriptions, wear patterns, and material composition.',
    benefits: [
      'Reveals tiny inscriptions and symbols',
      'Identifies material types and manufacturing techniques',
      'Detects damage or restoration attempts'
    ],
    historicalNote: 'Hand lenses have been essential archaeological tools since the 18th century, when systematic artifact analysis began.'
  },
  shovel: {
    name: 'Shovel',
    icon: '🥄',
    description: 'A digging tool with a broad blade for moving earth and sediment.',
    archaeologyUse: 'Shovels are used for initial excavation and removing overburden—the layers of soil above archaeological deposits. Archaeologists use flat-bladed shovels to carefully expose horizontal surfaces.',
    benefits: [
      'Efficient removal of non-archaeological soil layers',
      'Creates clean vertical profiles for stratigraphy study',
      'Essential for large-scale excavation'
    ],
    historicalNote: 'Bronze shovels were among the earliest metal tools, appearing around 3000 BCE. Roman armies carried standardized shovels (dolabra) for construction.'
  },
  pickaxe: {
    name: 'Pickaxe',
    icon: '⛏️',
    description: 'A T-shaped tool with a pointed head for breaking hard ground.',
    archaeologyUse: 'Pickaxes break through compacted soil, rocky deposits, and hardpan layers that shovels cannot penetrate. Archaeologists use smaller picks for controlled removal around features.',
    benefits: [
      'Breaks through hard or rocky soil',
      'Loosens compacted sediment layers',
      'Exposes buried architectural features'
    ],
    historicalNote: 'Pickaxes evolved from antler picks used in Neolithic flint mines. Roman miners used iron picks (dolabra) extensively in their extensive mining operations.'
  },
  brush: {
    name: 'Brush',
    icon: '🖌️',
    description: 'Soft-bristled brushes for delicate cleaning and sediment removal.',
    archaeologyUse: 'Brushes gently remove loose soil from fragile artifacts without scratching or damaging surfaces. Different brush sizes and bristle types are used for various materials.',
    benefits: [
      'Safe cleaning of delicate artifacts',
      'Reveals surface details and decorations',
      'Removes sediment from crevices and inscriptions'
    ],
    historicalNote: 'Archaeological brushes were adapted from artist\'s brushes. Sir Flinders Petrie pioneered careful brushwork techniques in Egyptian excavations during the 1880s.'
  },
  hammer_chisel: {
    name: 'Hammer & Chisel',
    icon: '🔨',
    description: 'Precision tools for carefully separating artifacts from surrounding matrix.',
    archaeologyUse: 'Hammer and chisel work removes encrusted material and frees artifacts embedded in rock or hardened sediment. This technique requires great skill to avoid damaging finds.',
    benefits: [
      'Frees artifacts from rock matrix',
      'Removes calcium carbonate encrustations',
      'Enables extraction from collapsed structures'
    ],
    historicalNote: 'These tools connect modern archaeology to ancient craftsmen. Roman sculptors and masons used nearly identical tools to those archaeologists use today.'
  }
};

class ToolSidebar {
  constructor() {
    this.currentTool = null;
    this.sidebarElement = null;
    this.contentElement = null;
    this.initialized = false;
  }

  /**
   * Creates and injects the sidebar DOM elements
   */
  initialize() {
    if (this.initialized) return;

    // Create sidebar container
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'tool-sidebar';
    this.sidebarElement.innerHTML = `
      <div class="sidebar-header">
        <h2>Tool Guide</h2>
      </div>
      <div id="tool-content" class="sidebar-content">
        <div class="tool-placeholder">
          <p>Select a tool to learn about its archaeological uses.</p>
        </div>
      </div>
    `;

    // Get the game wrapper and insert sidebar before game container
    const gameWrapper = document.getElementById('game-wrapper');
    const gameContainer = document.getElementById('game-container');

    if (gameWrapper && gameContainer) {
      gameWrapper.insertBefore(this.sidebarElement, gameContainer);
    } else {
      throw new Error('ToolSidebar: game-wrapper or game-container not found');
    }

    this.contentElement = document.getElementById('tool-content');
    this.initialized = true;
  }

  /**
   * Updates sidebar content when tool selection changes
   * @param {string} toolId - Currently selected tool ID
   */
  update(toolId) {
    if (!this.initialized) {
      this.initialize();
    }

    if (toolId === this.currentTool) return;
    this.currentTool = toolId;

    const toolInfo = TOOL_INFO[toolId];
    if (!toolInfo) {
      this.contentElement.innerHTML = `
        <div class="tool-placeholder">
          <p>Select a tool to learn about its archaeological uses.</p>
        </div>
      `;
      return;
    }

    const benefitsList = toolInfo.benefits
      .map(b => `<li>${b}</li>`)
      .join('');

    this.contentElement.innerHTML = `
      <div class="tool-info">
        <div class="tool-header">
          <span class="tool-icon">${toolInfo.icon}</span>
          <h3>${toolInfo.name}</h3>
        </div>

        <p class="tool-description">${toolInfo.description}</p>

        <div class="info-section">
          <h4>Archaeological Use</h4>
          <p>${toolInfo.archaeologyUse}</p>
        </div>

        <div class="info-section">
          <h4>Benefits</h4>
          <ul class="benefits-list">
            ${benefitsList}
          </ul>
        </div>

        <div class="info-section historical">
          <h4>Historical Note</h4>
          <p>${toolInfo.historicalNote}</p>
        </div>
      </div>
    `;
  }

  /**
   * Resets sidebar to default state
   */
  reset() {
    this.currentTool = null;
    if (this.contentElement) {
      this.contentElement.innerHTML = `
        <div class="tool-placeholder">
          <p>Select a tool to learn about its archaeological uses.</p>
        </div>
      `;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToolSidebar, TOOL_INFO };
}
