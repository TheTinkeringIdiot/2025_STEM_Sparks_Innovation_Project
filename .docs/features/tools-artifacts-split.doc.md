# Player State: Tools & Artifacts Separation

## Overview
Refactored player state to separate tools (excavation equipment) from artifacts (collectible items), clarifying the distinction between usable items and collection items throughout the codebase.

## User Perspective
Players now have two distinct inventories:
- **Tools**: Excavation equipment (stadia rod, magnifying glass, shovel, etc.) shown in the bottom toolbar - used for exploration and artifact discovery
- **Artifacts**: Collected items (amphora, denarius coin, etc.) stored in a separate artifacts collection - viewed via the "I" key and donated to the museum at level completion

This separation makes it clearer what items are usable tools vs. what items are collectible treasures.

## Data Flow
1. Player excavates a POI with the correct tool (SPACEBAR)
2. `toolSystem.js` validates the tool and triggers confetti effect
3. Artifact ID is added to `player.artifacts` array (not `player.tools`)
4. Artifact appears in inventory when player presses "I" key
5. At level completion, artifacts are donated to museum and converted to funding
6. Player progresses to next level with updated tools based on level progression
7. Artifacts collection is cleared for the next level

## Implementation

### Key Files
- `gameState.js` - Core player state structure with `tools` and `artifacts` arrays
- `toolSystem.js` - Excavation logic adds artifacts to `player.artifacts` collection
- `hudRenderer.js` - Renders tool bar (renamed from inventory bar) for tool selection
- `game.js` - Integrates artifact inventory UI and level completion flow
- `artifactInventory.js` - New UI for viewing collected artifacts (toggle with "I" key)
- `museum.js` - Processes artifact donations and awards funding at level completion

### State Structure

**Before (breaking change):**
```javascript
// Player shape (OLD)
{
  position: { x: number, y: number },
  money: number,
  inventory: string[], // Mixed tools AND artifacts
  currentTool: string,
  direction: 'up'|'down'|'left'|'right'
}
```

**After:**
```javascript
// Player shape (NEW)
{
  position: { x: number, y: number },
  money: number,
  tools: string[], // Tool IDs only: ['stadia_rod', 'magnifying_glass', 'shovel', ...]
  artifacts: string[], // Artifact IDs only: ['amphora', 'denarius_coin', ...]
  currentTool: string,
  direction: 'up'|'down'|'left'|'right'
}
```

### Function Renames
- `updateInventoryForLevel()` → `updateToolsForLevel()` - Updates available tools based on level progression
- `renderInventoryBar()` → `renderToolBar()` - Renders tool selection UI
- `handleInventoryClick()` → `handleToolBarClick()` - Handles tool selection clicks
- `getInventoryBarBounds()` → `getToolBarBounds()` - Returns toolbar hit test bounds

### Default State (gameState.js)
```javascript
function createDefaultGameState() {
  return {
    player: {
      position: { x: 0, y: 0 },
      money: 100,
      tools: ['stadia_rod', 'magnifying_glass'], // Starting tools
      artifacts: [], // Empty artifact collection
      currentTool: 'stadia_rod',
      direction: 'down'
    },
    // ... level and museum state
  };
}
```

### Artifact Collection (toolSystem.js:228-236)
```javascript
handleCorrectTool(poi, artifact) {
  // Play confetti at POI location
  const worldX = poi.position.x * 40 + 20;
  const worldY = poi.position.y * 40 + 20;
  this.confettiSystem.emit(worldX, worldY, 40);

  // Add artifact to player artifacts collection (NEW)
  if (!this.gameState.player.artifacts) {
    this.gameState.player.artifacts = [];
  }
  this.gameState.player.artifacts.push(artifact.id);

  // Remove POI and show success message
  this.removePOI(poi);
  this.hintText = `Found: ${artifact.name}`;
  this.hintStartTime = performance.now();
}
```

### Tool Bar Rendering (hudRenderer.js)
- Variable renames: `inventoryBarX` → `toolBarX`, `inventoryBarY` → `toolBarY`, `inventoryBarWidth` → `toolBarWidth`
- Cache state: `unlockedTools` → `tools`
- Parameter renames: `unlockedTools` → `tools` throughout method signatures
- References updated from `gameState.player.inventory` to `gameState.player.tools`

## Configuration
- **Tool progression**: Defined in `TOOL_UNLOCKS` constant (gameState.js:134-145)
- **Artifact catalog**: Defined in `ARTIFACT_CATALOG` constant (gameState.js:7-131)
- **Tool-artifact mapping**: Defined in `TOOL_ARTIFACT_MAP` constant (gameState.js:148-153)

## Usage Example
```javascript
// Accessing player tools (for UI rendering)
const availableTools = gameState.player.tools; // ['stadia_rod', 'magnifying_glass', 'shovel']
const selectedTool = gameState.player.currentTool; // 'shovel'

// Accessing collected artifacts (for museum donation)
const collectedArtifacts = gameState.player.artifacts; // ['amphora', 'denarius_coin', 'oil_lamp']

// Update tools when progressing to next level
updateToolsForLevel(gameState, 2); // Unlocks pickaxe for level 2
console.log(gameState.player.tools); // ['stadia_rod', 'magnifying_glass', 'shovel', 'pickaxe']

// Artifact is added when correct tool is used
// (happens automatically in toolSystem.handleCorrectTool)
gameState.player.artifacts.push('amphora');
```

## Testing
- **Manual test**:
  1. Start new game (level 1)
  2. Verify tool bar shows: ROD, MAG, SHV (3 tools unlocked)
  3. Excavate POI with correct tool
  4. Press "I" key to open artifact inventory
  5. Verify artifact appears in collection
  6. Complete level (excavate all 15 POIs)
  7. Verify museum shows all collected artifacts
  8. Continue to next level and verify artifacts list is cleared
  9. Verify tools are updated based on new level

- **Expected behavior**:
  - Tools persist across levels (based on level progression)
  - Artifacts are cleared after museum donation
  - Funding is awarded based on artifact values
  - Tool bar only shows tools, not artifacts
  - Artifact inventory shows collection of found items

## Breaking Changes
- **Player state shape changed**: `inventory` field split into `tools` and `artifacts`
- **Function signatures**: All references to `inventory` parameter renamed to `tools` or `artifacts` depending on context
- **Save data**: Existing save files will need migration or reset (handled in `loadGameState()` via `updateToolsForLevel()`)

## Related Documentation
- Architecture: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/CLAUDE.md` (Type Patterns section needs update)
- Game State: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/gameState.js`
- Tool System: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/toolSystem.js`
- HUD Rendering: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/hudRenderer.js`
