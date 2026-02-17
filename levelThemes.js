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

    // Sand and brown dirt only — no stone, no grass
    terrainThresholds: [-2, 0.1, -2],

    // Orange sand + brown dirt desert palette
    terrainColorOverrides: {
      stone: [140, 100, 55],    // Dark brown (unused)
      grass: [160, 115, 60],    // Brown (unused)
      dirt: [145, 100, 50],     // Brown earth
      sand: [230, 160, 60],     // Orange sand
      ground: [155, 108, 55]    // Medium brown
    },

    // Ruins and rocks only — no vegetation
    obstacleWeights: [
      { type: 'ruin_column', weight: 0.35 },
      { type: 'ruin_wall', weight: 0.35 },
      { type: 'rock_small', weight: 0.18 },
      { type: 'rock_large', weight: 0.12 }
    ],

    // Fewer natural decorations in urban setting
    decorationChance: 0.12,

    // Exclude all vegetation decorations — desert only
    excludeDecorations: ['grass_tuft', 'flower_yellow', 'flower_purple', 'clover', 'leaf', 'twig'],

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

  3: {
    name: 'Harbor Town',

    // Mostly grass with some dirt — lush riverside port
    terrainThresholds: [-2, -0.2, 0.6],

    // No color overrides — use default green grass
    terrainColorOverrides: null,

    // Rivers: one horizontal river across the map
    rivers: {
      count: 2,
      width: 3
    },

    // Port town: mix of trees, ruins, and rocks
    obstacleWeights: [
      { type: 'ruin_column', weight: 0.15 },
      { type: 'ruin_wall', weight: 0.15 },
      { type: 'tree_cypress', weight: 0.25 },
      { type: 'tree_olive', weight: 0.20 },
      { type: 'rock_small', weight: 0.15 },
      { type: 'rock_large', weight: 0.10 }
    ],

    decorationChance: 0.18,

    // Level 3 has shovel + pickaxe + brush
    artifactPool: {
      valuable: {
        shovel: ['amphora', 'oil_lamp', 'votive_statue'],
        pickaxe: ['mosaic_tile', 'fresco_fragment'],
        brush: ['denarius_coin', 'signet_ring', 'fibula']
      },
      junk: {
        shovel: ['corroded_nail', 'animal_bone'],
        pickaxe: ['stone_fragment'],
        brush: ['broken_pottery']
      }
    },

    poiPrefixes: ['Sunken', 'Riverside', 'Docked', 'Weathered', 'Tidal'],
    poiSuffixes: ['Wharf', 'Warehouse', 'Anchor', 'Dock Post', 'Cargo Hold', 'Quay Wall'],

    poiDescriptions: [
      'The remains of a busy Roman harbor lie beneath the soil.',
      'Trade goods from across the Mediterranean once passed through here.',
      'An old docking area where Roman ships were moored.',
      'Cargo from distant provinces was unloaded at this spot.',
      'A once-thriving port that connected Rome to the world.'
    ]
  },
  4: {
    name: 'Volcanic Ruins',

    // Dark volcanic terrain: heavy stone, ash-gray dirt, no grass, light pumice sand
    terrainThresholds: [-0.3, -2, 0.5],

    terrainColorOverrides: {
      stone: [60, 58, 65],    // Dark basalt
      dirt: [95, 88, 82],     // Volcanic ash
      grass: [95, 88, 82],    // Disabled (threshold -2), fallback to ash
      sand: [160, 148, 130],  // Pumice
      water: [200, 60, 20]    // Lava orange-red
    },

    // 1 lava river (narrow)
    rivers: {
      count: 1,
      width: 2
    },

    // Heavy ruins + volcanic rocks, no trees
    obstacleWeights: [
      { type: 'ruin_column', weight: 0.30 },
      { type: 'ruin_wall', weight: 0.35 },
      { type: 'rock_small', weight: 0.15 },
      { type: 'rock_large', weight: 0.20 }
    ],

    decorationChance: 0.10,

    // Exclude all vegetation + shells + sand ripples
    excludeDecorations: [
      'grass_tuft', 'flower_yellow', 'flower_purple', 'clover', 'leaf', 'twig',
      'shell', 'sand_ripple'
    ],

    // Level 4 has shovel + pickaxe + brush + hammer_chisel
    artifactPool: {
      valuable: {
        shovel: ['plaster_body_cast', 'carbonized_bread', 'thermopolium_pot', 'garden_fresco_panel'],
        pickaxe: ['marble_venus_statue', 'lararium_shrine', 'volcanic_glass_cameo'],
        brush: ['gold_bulla_amulet', 'ivory_dice_set', 'silver_mirror_pompeii'],
        hammer_chisel: ['petrified_scroll', 'basalt_millstone', 'embedded_bronze_valve']
      },
      junk: {
        shovel: ['volcanic_ash_clump', 'charred_timber'],
        pickaxe: ['pumice_chunk'],
        brush: ['fused_coin_mass'],
        hammer_chisel: ['hardened_mortar_lump']
      }
    },

    // Pompeii-themed POI naming
    poiPrefixes: ['Buried', 'Scorched', 'Ash-Covered', 'Petrified', 'Entombed'],
    poiSuffixes: ['Thermopolium', 'Domus', 'Bakery', 'Atrium', 'Peristyle', 'Basilica'],

    poiDescriptions: [
      'Volcanic ash preserved this site in a frozen moment of time.',
      'The ruins of a Pompeii-style town lie buried beneath hardened lava.',
      'A once-thriving Roman neighborhood entombed by volcanic fury.',
      'Layers of ash and pumice conceal the remains of daily life.',
      'The eruption sealed this place like a time capsule for millennia.'
    ]
  },
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
