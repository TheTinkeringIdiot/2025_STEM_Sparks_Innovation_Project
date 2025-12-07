/**
 * Core Game State Structure
 * Manages player state, level state, museum state, artifact catalog, and save/load functionality
 */

// Artifact catalog with tool mappings
const ARTIFACT_CATALOG = {
  // Valuable artifacts ($100 each)
  amphora: {
    id: 'amphora',
    name: 'Amphora',
    description: 'Large ceramic vessel used for storing wine and olive oil',
    value: 100,
    toolRequired: 'shovel',
    isJunk: false
  },
  denarius_coin: {
    id: 'denarius_coin',
    name: 'Denarius Coin',
    description: "Silver currency featuring Emperor's profile",
    value: 100,
    toolRequired: 'brush',
    isJunk: false
  },
  mosaic_tile: {
    id: 'mosaic_tile',
    name: 'Mosaic Tile',
    description: 'Colorful tesserae from villa floor decorations',
    value: 100,
    toolRequired: 'pickaxe',
    isJunk: false
  },
  oil_lamp: {
    id: 'oil_lamp',
    name: 'Oil Lamp',
    description: 'Terra cotta lamp with decorative relief patterns',
    value: 100,
    toolRequired: 'shovel',
    isJunk: false
  },
  fibula: {
    id: 'fibula',
    name: 'Fibula',
    description: 'Ornate bronze brooch for fastening garments',
    value: 100,
    toolRequired: 'brush',
    isJunk: false
  },
  strigil: {
    id: 'strigil',
    name: 'Strigil',
    description: 'Curved bronze tool for bathing rituals',
    value: 100,
    toolRequired: 'hammer_chisel',
    isJunk: false
  },
  signet_ring: {
    id: 'signet_ring',
    name: 'Signet Ring',
    description: 'Gold ring with carved gemstone seal',
    value: 100,
    toolRequired: 'brush',
    isJunk: false
  },
  fresco_fragment: {
    id: 'fresco_fragment',
    name: 'Fresco Fragment',
    description: 'Painted wall plaster from villa interior',
    value: 100,
    toolRequired: 'pickaxe',
    isJunk: false
  },
  gladius_pommel: {
    id: 'gladius_pommel',
    name: 'Gladius Pommel',
    description: 'Decorative sword handle piece',
    value: 100,
    toolRequired: 'hammer_chisel',
    isJunk: false
  },
  votive_statue: {
    id: 'votive_statue',
    name: 'Votive Statue',
    description: 'Small marble figure offered to the gods',
    value: 100,
    toolRequired: 'shovel',
    isJunk: false
  },

  // Junk items ($0-10 each)
  broken_pottery: {
    id: 'broken_pottery',
    name: 'Broken Pottery Shard',
    description: 'Unidentifiable ceramic fragment',
    value: 5,
    toolRequired: 'brush',
    isJunk: true
  },
  corroded_nail: {
    id: 'corroded_nail',
    name: 'Corroded Nail',
    description: 'Heavily oxidized iron fastener',
    value: 2,
    toolRequired: 'shovel',
    isJunk: true
  },
  stone_fragment: {
    id: 'stone_fragment',
    name: 'Stone Fragment',
    description: 'Unremarkable piece of building material',
    value: 3,
    toolRequired: 'pickaxe',
    isJunk: true
  },
  animal_bone: {
    id: 'animal_bone',
    name: 'Animal Bone',
    description: 'Common livestock remains',
    value: 1,
    toolRequired: 'shovel',
    isJunk: true
  },
  weathered_brick: {
    id: 'weathered_brick',
    name: 'Weathered Brick',
    description: 'Deteriorated clay building block',
    value: 4,
    toolRequired: 'hammer_chisel',
    isJunk: true
  }
};

// Tool unlock progression by level
const TOOL_UNLOCKS = {
  1: ['stadia_rod', 'magnifying_glass', 'shovel'],
  2: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe'],
  3: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush'],
  4: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  5: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  6: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  7: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  8: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  9: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel'],
  10: ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe', 'brush', 'hammer_chisel']
};

// Tool to artifacts mapping (for quick lookup)
const TOOL_ARTIFACT_MAP = {
  shovel: ['amphora', 'oil_lamp', 'votive_statue', 'corroded_nail', 'animal_bone'],
  pickaxe: ['mosaic_tile', 'fresco_fragment', 'stone_fragment'],
  brush: ['denarius_coin', 'signet_ring', 'fibula', 'broken_pottery'],
  hammer_chisel: ['strigil', 'gladius_pommel', 'weathered_brick']
};

// Default game state structure
function createDefaultGameState() {
  return {
    player: {
      position: { x: 0, y: 0 },
      money: 100,
      tools: ['stadia_rod', 'magnifying_glass'],
      artifacts: [],
      currentTool: 'stadia_rod',
      direction: 'down'
    },
    level: {
      island: 'roman',
      number: 1,
      pois: [],
      revealedTiles: new Set(),
      obstacles: []
    },
    museum: {
      collection: []
    }
  };
}

// Initialize new game state
function initializeGameState() {
  return createDefaultGameState();
}

// Get tools available for current level
function getAvailableTools(levelNumber) {
  return TOOL_UNLOCKS[levelNumber] || TOOL_UNLOCKS[1];
}

// Update player tools based on level progression
function updateToolsForLevel(gameState, levelNumber) {
  gameState.player.tools = getAvailableTools(levelNumber);

  // Ensure current tool is in tools, default to stadia_rod if not
  if (!gameState.player.tools.includes(gameState.player.currentTool)) {
    gameState.player.currentTool = 'stadia_rod';
  }
}

// Get artifact by ID
function getArtifact(artifactId) {
  return ARTIFACT_CATALOG[artifactId] || null;
}

// Get artifacts that can be found with a specific tool
function getArtifactsForTool(toolId) {
  return TOOL_ARTIFACT_MAP[toolId] || [];
}

// Get random artifact for a tool
function getRandomArtifactForTool(toolId) {
  const artifacts = getArtifactsForTool(toolId);
  if (artifacts.length === 0) return null;
  return artifacts[Math.floor(Math.random() * artifacts.length)];
}

// Save game state to localStorage
function saveGameState(gameState) {
  try {
    // Create serializable save data
    const saveData = {
      player: {
        money: gameState.player.money,
        currentTool: gameState.player.currentTool,
        direction: gameState.player.direction
      },
      level: {
        island: gameState.level.island,
        number: gameState.level.number
      },
      museum: {
        collection: gameState.museum.collection
      },
      timestamp: Date.now()
    };

    // Convert to JSON and save
    localStorage.setItem('archeology_game_save', JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    return false;
  }
}

// Validate save data structure
function isValidSaveData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Validate player data
  if (!data.player || typeof data.player !== 'object') {
    return false;
  }
  if (typeof data.player.money !== 'number' || data.player.money < 0) {
    return false;
  }

  // Validate level data
  if (!data.level || typeof data.level !== 'object') {
    return false;
  }
  if (typeof data.level.number !== 'number' || data.level.number < 1 || data.level.number > 10) {
    return false;
  }

  // Validate museum data
  if (!data.museum || typeof data.museum !== 'object') {
    return false;
  }
  if (!Array.isArray(data.museum.collection)) {
    return false;
  }

  return true;
}

// Load game state from localStorage
function loadGameState() {
  try {
    const savedData = localStorage.getItem('archeology_game_save');

    if (!savedData) {
      return null;
    }

    const parsed = JSON.parse(savedData);

    // Validate save data structure
    if (!isValidSaveData(parsed)) {
      console.warn('Invalid save data structure, resetting to defaults');
      return null;
    }

    // Create new game state with loaded data
    const gameState = createDefaultGameState();

    // Restore player state
    gameState.player.money = parsed.player.money || 100;
    gameState.player.currentTool = parsed.player.currentTool || 'stadia_rod';
    gameState.player.direction = parsed.player.direction || 'down';

    // Restore level state
    gameState.level.island = parsed.level.island || 'roman';
    gameState.level.number = parsed.level.number || 1;

    // Restore museum collection
    gameState.museum.collection = parsed.museum.collection || [];

    // Update tools based on current level
    updateToolsForLevel(gameState, gameState.level.number);

    return gameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

// Clear save data (for new game or reset)
function clearSaveData() {
  try {
    localStorage.removeItem('archeology_game_save');
    return true;
  } catch (error) {
    console.error('Failed to clear save data:', error);
    return false;
  }
}

// Check if save data exists
function hasSaveData() {
  return localStorage.getItem('archeology_game_save') !== null;
}

// Serialize Set to Array for debugging/logging
function serializeGameState(gameState) {
  return {
    ...gameState,
    level: {
      ...gameState.level,
      revealedTiles: Array.from(gameState.level.revealedTiles)
    }
  };
}

// Deserialize Array to Set when loading level data
function deserializeRevealedTiles(tilesArray) {
  return new Set(tilesArray || []);
}
