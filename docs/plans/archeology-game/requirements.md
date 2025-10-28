# Archeology Game Requirements

## Overview

Browser-based archeology exploration game where players discover and extract artifacts through procedurally generated levels. Players use authentic archeological tools to map terrain, investigate points of interest, and extract valuable artifacts to fund their expeditions.

**Theme:** Roman archeology (first island)
**Platform:** Browser (HTML5 Canvas + JavaScript)
**Resolution:** 1440x960px
**Target:** Large monitors

## User Flow

### Game Start
1. Player begins with $100, starting at Level 1 (tutorial) on the Roman Island
2. Character spawns in a small revealed area surrounded by fog-of-war
3. HUD displays: money counter, tool inventory bar, current tool selection, minimap

### Core Gameplay Loop (Per Level)
1. **Mapping Phase**
   - Player equips stadia rod from inventory (mouse selection)
   - Activates stadia rod (spacebar) while exploring
   - Fog-of-war reveals as player moves (200px radius around character)
   - POIs appear as glowing rhombuses on map and terrain

2. **Investigation Phase**
   - Player moves to POI (WASD or arrow keys)
   - Equips magnifying glass and activates (spacebar)
   - Receives hint about appropriate extraction tool

3. **Extraction Phase**
   - Player equips suggested tool (shovel, pickaxe, brush, or hammer & chisel)
   - Activates tool at POI (spacebar)
   - **Correct tool:** Artifact extracted, POI disappears, tool animation plays
   - **Wrong tool (1st try):** Screen edges flash red, no extraction
   - **Wrong tool (2nd try):** POI removed permanently, no artifact

4. **Level Completion**
   - After all 15 POIs processed (extracted or removed)
   - "Level Complete" screen displays
   - Player proceeds to museum

5. **Museum Phase**
   - Player sees collected artifacts (icons only, names/descriptions hidden)
   - "Donate All" button transfers artifacts to museum collection
   - Money balance updates (+$100 per valuable artifact, +$0-10 per junk)
   - Museum displays only donated items with full details
   - Player proceeds to next level

6. **Progression**
   - Level 1: Tutorial - teaches stadia rod → magnifying glass → extraction flow
   - Levels 1-4: Unlock extraction tools sequentially (shovel, pickaxe, brush, hammer & chisel)
   - Level 10 completion: Congratulations screen with confetti, next island unlocks (placeholder)

## Technical Implementation

### Architecture
**No-build, client-side only:**
- Open `index.html` directly in browser (file:// protocol)
- No build process, bundlers, or compilation
- No local dev server required
- All dependencies inline or vanilla JS

**File structure:**
```
/
├── index.html          # Entry point
├── game.js            # Core game logic
├── renderer.js        # Canvas rendering
├── levelGenerator.js  # Procedural generation
├── styles.css         # UI styling
└── [additional .js modules as needed]
```

**Asset generation:**
- Character sprite: Fixed sprite sheet (40x40px tiles, 4 directions × animation frames), drawn once at startup
- Backgrounds/terrain: Procedurally generated per island theme, deterministic per level
- POI markers: Programmatically drawn (40x40px glowing rhombus)
- All generation via Canvas 2D API

### Canvas Architecture
**Multi-layer rendering:**
1. Background layer: Terrain tiles
2. POI layer: Glowing rhombus markers
3. Character layer: Player sprite with animations
4. UI layer: HUD elements
5. Fog-of-war overlay: Semi-transparent mask

### Sprite Specifications
- **Tile size:** 40x40px
- **Character sprite:** 40x40px with directional facing (up/down/left/right) and walk animation frames
- **POI marker:** 40x40px glowing rhombus
- **Style:** Pixel art, Stardew Valley aesthetic, adorable characters

### Controls
- **Movement:** WASD or arrow keys (continuous)
- **Tool selection:** Mouse click on inventory bar
- **Tool activation:** Spacebar (context-sensitive based on equipped tool)

### Game State Management
```javascript
{
  player: {
    position: {x, y},
    money: 100,
    inventory: ['stadia_rod', 'magnifying_glass', ...unlocked tools],
    currentTool: 'stadia_rod',
    direction: 'down'
  },
  level: {
    island: 'roman',
    number: 1,
    pois: [{id, x, y, type, toolRequired, artifact, value, wrongAttempts: 0}],
    revealedTiles: Set(),
    obstacles: [{x, y, width, height}]
  },
  museum: {
    collection: [artifactIds]
  }
}
```

### Procedural Generation Rules
**Per level generation:**
- Consistent Roman biome terrain
- Random obstacle placement (ruins, trees, rocks)
- 15 POIs placed randomly on accessible tiles
  - 10 valuable artifacts (each worth $100)
  - 5 junk items (each worth $0-10 random)
- Ensure minimum spacing between POIs and obstacles
- Player spawn in accessible area

### Tool Unlock Progression
- **Level 1:** Shovel unlocked
- **Level 2:** Pickaxe unlocked
- **Level 3:** Brush unlocked
- **Level 4:** Hammer & chisel unlocked
- All levels: Stadia rod and magnifying glass always available

### Save System
- Save to localStorage after each level completion
- Persist: player money, current level, tool unlocks, museum collection
- Save key: `archeology_game_save`

### Fog-of-War System
- Fog covers entire map except starting reveal area (200px radius around spawn)
- As player moves, reveal tiles within 200px radius
- Revealed tiles remain visible for remainder of level
- POIs only visible when their tile is revealed

### Visual Feedback
**Tool animations:**
- Shovel: Digging motion
- Pickaxe: Overhead swing
- Brush: Sweeping motion
- Hammer & chisel: Chipping motion
- Duration: ~500ms per animation

**Error feedback:**
- Wrong tool usage: Red flash on screen edges (200ms)

**Level complete:**
- Full-screen overlay with "Level Complete" text
- Transition button to museum

**Island complete:**
- Confetti animation
- "Congratulations!" message
- "Next Island Unlocked" (placeholder for future islands)

### UI Components
**HUD (always visible):**
- Top-left: Money display ($XXX)
- Bottom-center: Tool inventory bar (6 slots: stadia rod, magnifying glass, 4 extraction tools)
- Bottom-right: Minimap (150x100px, shows revealed area, POIs, player position)
- Current tool highlight in inventory bar

**Museum Screen:**
- Grid of artifact icons
- Artifact name + description on hover (after donation)
- "Donate All" button
- "Continue to Next Level" button

## Data Structures

### Roman Artifacts (Predefined List)
**Valuable artifacts ($100 each):**
1. **Amphora** - Large ceramic vessel used for storing wine and olive oil
2. **Denarius Coin** - Silver currency featuring Emperor's profile
3. **Mosaic Tile** - Colorful tesserae from villa floor decorations
4. **Oil Lamp** - Terra cotta lamp with decorative relief patterns
5. **Fibula** - Ornate bronze brooch for fastening garments
6. **Strigil** - Curved bronze tool for bathing rituals
7. **Signet Ring** - Gold ring with carved gemstone seal
8. **Fresco Fragment** - Painted wall plaster from villa interior
9. **Gladius Pommel** - Decorative sword handle piece
10. **Votive Statue** - Small marble figure offered to the gods

**Junk items ($0-10 each):**
1. **Broken Pottery Shard** - Unidentifiable ceramic fragment
2. **Corroded Nail** - Heavily oxidized iron fastener
3. **Stone Fragment** - Unremarkable piece of building material
4. **Animal Bone** - Common livestock remains
5. **Weathered Brick** - Deteriorated clay building block

### Tool-to-Artifact Mapping Logic
Each artifact type has one appropriate tool:
- **Shovel:** Amphora, Oil Lamp, Votive Statue, junk items
- **Pickaxe:** Mosaic Tile, Fresco Fragment, Stone Fragment
- **Brush:** Denarius Coin, Signet Ring, Fibula, Broken Pottery Shard
- **Hammer & Chisel:** Strigil, Gladius Pommel, Weathered Brick

## Assumptions and Constraints

### In Scope
- Single Roman-themed island (10 levels)
- All core mechanics (mapping, investigation, extraction, museum)
- Procedural level generation
- localStorage persistence
- Placeholder pixel art assets
- Tutorial level (Level 1)

### Out of Scope (Future Phases)
- Sound effects and music
- Money spending mechanics (shop, upgrades, hints)
- Additional islands beyond Roman theme
- Multiplayer or social features
- Mobile responsive design
- Difficulty settings

### Technical Constraints
- Browser compatibility: Modern Chrome/Firefox/Safari (ES6+ with native module support)
- No backend server or build process - runs directly from file:// protocol
- LocalStorage size limit: ~5MB (sufficient for save data)
- Canvas performance: Target 60fps on large monitors

### Breaking Changes Allowed
- Pre-production phase: OK to refactor without backwards compatibility
- Errors should throw early rather than use fallbacks
- No `any` types in TypeScript/JSDoc - use explicit types

## Success Criteria

**MVP Complete When:**
1. Player can complete tutorial level start-to-finish
2. All 10 levels on Roman island are playable
3. Procedural generation creates varied but fair layouts
4. Tool unlock progression works correctly
5. Museum donation and money tracking functional
6. Save/load persists across browser sessions
7. All UI elements display correctly at 1440x960
8. Pixel art assets render for all game objects

**Quality Benchmarks:**
- No visual glitches during fog-of-war reveal
- Smooth character movement and collision detection
- Tool animations feel responsive (<100ms input lag)
- Level generation completes in <500ms
- Game loads saved state in <200ms
