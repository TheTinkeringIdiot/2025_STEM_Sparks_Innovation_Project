/**
 * Level Theme Configurations
 * Per-level theming data for terrain, obstacles, artifacts, and POI text.
 * Each level can override defaults to create distinct visual and gameplay identity.
 */

const LEVEL_THEMES = {
  1: {
    name: 'Rural Roman Countryside',

    // Terrain noise thresholds: noise < t[0] => stone, < t[1] => dirt, < t[2] => grass, else sand
    terrainThresholds: [-0.3, 0.0, 0.3],

    // null = use TileRenderer default colors
    terrainColorOverrides: null,

    // Obstacle selection weights (must match ObstacleType keys in levelGenerator.js)
    obstacleWeights: [
      { type: 'ruin_column', weight: 0.2 },
      { type: 'ruin_wall', weight: 0.2 },
      { type: 'tree_cypress', weight: 0.2 },
      { type: 'tree_olive', weight: 0.15 },
      { type: 'rock_small', weight: 0.15 },
      { type: 'rock_large', weight: 0.1 }
    ],

    // Probability a non-obstacle tile gets a decoration
    decorationChance: 0.15,

    // Artifact pools organized by tool, separated into valuable and junk
    artifactPool: {
      valuable: {
        shovel: ['amphora', 'oil_lamp', 'votive_statue'],
        pickaxe: ['mosaic_tile', 'fresco_fragment'],
        brush: ['denarius_coin', 'signet_ring', 'fibula'],
        hammer_chisel: ['strigil', 'gladius_pommel']
      },
      junk: {
        shovel: ['corroded_nail', 'animal_bone'],
        pickaxe: ['stone_fragment'],
        brush: ['broken_pottery'],
        hammer_chisel: ['weathered_brick']
      }
    },

    // POI name generation arrays
    poiPrefixes: ['Ancient', 'Lost', 'Hidden', 'Forgotten', 'Sacred'],
    poiSuffixes: ['Altar', 'Column', 'Inscription', 'Mosaic', 'Statue', 'Temple'],

    // POI description pool
    poiDescriptions: [
      'A remarkable Roman artifact waiting to be discovered.',
      'Evidence of ancient Roman civilization lies here.',
      'This site holds secrets from the Roman Empire.',
      'A place where Romans once walked and worked.',
      'Ancient history preserved in stone and earth.'
    ]
  },

  2: {
    name: 'Roman Villa & Forum',

    // More sand and dirt, less grass — arid excavation site
    terrainThresholds: [-0.1, 0.1, 0.22],

    // Orange/brown sand vibes — sun-baked Mediterranean dig site
    terrainColorOverrides: {
      stone: [175, 145, 105],   // Warm sandstone
      grass: [155, 140, 85],    // Dried/yellowed scrub
      dirt: [180, 130, 80],     // Warm orange-brown earth
      sand: [225, 180, 130],    // Orange-tinted sand
      ground: [165, 125, 80]    // Medium warm brown
    },

    // Heavy on ruins, light on vegetation
    obstacleWeights: [
      { type: 'ruin_column', weight: 0.30 },
      { type: 'ruin_wall', weight: 0.30 },
      { type: 'tree_cypress', weight: 0.08 },
      { type: 'tree_olive', weight: 0.07 },
      { type: 'rock_small', weight: 0.15 },
      { type: 'rock_large', weight: 0.10 }
    ],

    // Fewer natural decorations in urban setting
    decorationChance: 0.12,

    // Exclude green vegetation decorations — keep only arid/urban ones
    excludeDecorations: ['grass_tuft', 'flower_yellow', 'flower_purple', 'clover'],

    // Level 2 has shovel + pickaxe (per TOOL_UNLOCKS)
    artifactPool: {
      valuable: {
        shovel: ['bronze_speculum', 'garum_amphora', 'terracotta_figurine', 'tegula_legion_stamp'],
        pickaxe: ['lead_curse_tablet', 'sestertius_coin', 'roman_glass_vessel', 'pilum_tip']
      },
      junk: {
        shovel: ['roof_tile_fragment', 'charcoal_remnants'],
        pickaxe: ['iron_slag']
      }
    },

    // Villa/forum-specific POI naming
    poiPrefixes: ['Crumbling', 'Ornate', 'Imperial', 'Buried', 'Marble'],
    poiSuffixes: ['Atrium', 'Colonnade', 'Fountain', 'Peristyle', 'Forum Floor', 'Villa Wall'],

    poiDescriptions: [
      'Remnants of a grand Roman villa lie beneath the surface.',
      'The forum pavement here shows signs of buried treasures.',
      'Marble fragments suggest an important public building.',
      'A wealthy Roman household once occupied this spot.',
      'This area was once a bustling center of Roman civic life.'
    ]
  },

  // Placeholder themes for islands 3-5 (use level 1 defaults with distinct names)
  3: { name: 'Harbor Town' },
  4: { name: 'Mountain Pass' },
  5: { name: 'Sacred Grove' }
};

/**
 * Get theme config for a level, falling back to level 1 defaults for missing fields
 * @param {number} levelNumber - Level number (1-5)
 * @returns {Object} Theme configuration object
 */
function getLevelTheme(levelNumber) {
  const base = LEVEL_THEMES[1];
  const theme = LEVEL_THEMES[levelNumber];
  if (!theme) return base;
  // Merge: theme overrides base, missing fields fall back to level 1
  return { ...base, ...theme };
}
