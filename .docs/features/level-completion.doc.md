# Level Completion and Museum System

## Overview
Automatic level completion system that triggers when all POIs are excavated, displaying a museum screen with collected artifacts and funding summary before advancing to the next level.

## User Perspective
When the player excavates the final POI in a level, the game automatically:
1. Shows a full-screen museum overlay with "Level Complete!" title
2. Displays all collected artifacts in a grid with icons, names, descriptions, and values
3. Shows total funding received from artifact donations
4. Presents a single "Continue to Next Level" button
5. Adds funding to player wallet and advances to next level when clicked

The museum acts as both a completion screen and donation workflow in a single seamless interaction.

## Data Flow
1. Player excavates final POI using appropriate tool
2. `game.checkLevelComplete()` detects all POIs are gone (`gameState.level.pois.length === 0`)
3. Sets `game.isLevelComplete = true` flag to block further input
4. Calls `game.onLevelComplete()` which passes collected artifacts to museum
5. `museum.show(collectedArtifacts)` renders full-screen overlay with artifact grid and funding summary
6. Player clicks "Continue to Next Level" button
7. `museum.donateAndContinue()` executes:
   - Calculates total funding from collected artifacts
   - Adds funding to `gameState.player.money`
   - Moves artifacts to `gameState.museum.collection` (permanent)
   - Saves game state to localStorage
8. `museum.continueToNextLevel()` hides overlay and triggers callback
9. `game.onContinueToNextLevel()` clears player artifacts and loads next level
10. Game resets `isLevelComplete = false` for new level

## Implementation

### Key Files
- `game.js` - Core completion detection and orchestration
  - `checkLevelComplete()` (lines 546-559): Checks if all POIs excavated
  - `onLevelComplete()` (lines 565-573): Triggers museum screen with artifacts
  - `onContinueToNextLevel()` (lines 578-590): Clears state and loads next level
  - `update()` line 197: Blocks input when `isLevelComplete` is true
  - `update()` line 225: Calls `checkLevelComplete()` every frame

- `museum.js` - Museum screen rendering and donation logic
  - `show(collectedArtifacts)` (lines 48-61): Display museum overlay
  - `render()` (lines 103-213): Build museum UI with artifacts grid, funding summary, continue button
  - `donateAndContinue()` (lines 220-248): Process donations, add funding, advance level
  - `createArtifactGrid()` (lines 257-332): Render artifact icons with details
  - `getArtifactColor()` / `getArtifactEmoji()` (lines 340-381): Visual artifact representation

- `gameState.js` - State management for artifacts and museum
  - `player.artifacts`: Temporary array of collected artifact IDs (cleared each level)
  - `museum.collection`: Permanent array of all donated artifact IDs (persists across levels)

### Game State Structure
```javascript
// Player state (temporary per level)
gameState.player = {
  artifacts: ['amphora', 'denarius_coin'], // Cleared on level completion
  money: 250 // Updated when artifacts donated
}

// Museum state (persistent across levels)
gameState.museum = {
  collection: ['amphora', 'denarius_coin', 'mosaic_tile'] // All donated artifacts
}

// Level state
gameState.level = {
  pois: [] // Empty array triggers level completion
}
```

### Completion Detection Logic
```javascript
// Called every frame in game loop
checkLevelComplete() {
  if (this.isLevelComplete) {
    return true; // Already completed
  }

  // Level is complete when all POIs have been excavated
  if (this.gameState.level.pois.length === 0) {
    this.isLevelComplete = true;
    this.onLevelComplete();
    return true;
  }

  return false;
}
```

### Input Blocking
During level completion, the `isLevelComplete` flag prevents player movement and tool usage:

```javascript
// In game.js update() method
if (this.artifactInventory.isVisible() || this.isLevelComplete) {
  return; // Skip movement, tool use, etc.
}
```

### Museum Rendering
The museum screen displays:
- **Title**: "Level Complete!" in large serif font
- **Subtitle**: "Artifacts Donated to Museum"
- **Artifact Grid**: Auto-fill grid (120px min width per item) with:
  - Colored circular icons based on artifact type/tool
  - Emoji representations (amphora, denarius, etc.)
  - Artifact name, description, and value
- **Funding Summary Box**: Gold-bordered section showing:
  - "Museum Funding Received" label
  - Count of artifacts donated
  - Total funding amount in large gold text
- **Continue Button**: Single action button styled with Roman theme

### Funding Calculation
```javascript
let totalFunding = 0;
tempInventoryArtifacts.forEach(artifactId => {
  const artifact = getArtifact(artifactId);
  if (artifact) {
    totalFunding += artifact.value; // $100 for valuable, $0-10 for junk
  }
});

gameState.player.money += totalFunding; // Add to wallet
```

## Configuration
No environment variables or feature flags required. System is always active.

**Constants**:
- Museum overlay z-index: 1000 (above all game layers)
- Level cap: 10 (next level calculation uses `Math.min(currentLevel + 1, 10)`)

## Usage Example
```javascript
// Initialize museum during game setup
this.museum = new Museum();
this.museum.initialize(this.gameState, () => this.onContinueToNextLevel());

// Check completion every frame
this.checkLevelComplete();

// Manually trigger completion (testing)
this.gameState.level.pois = []; // Clear all POIs
this.checkLevelComplete(); // Will trigger museum screen
```

## Testing

### Manual Test
1. Start a new game (level 1)
2. Use stadia rod to reveal fog
3. Excavate all 15 POIs using appropriate tools
4. On final POI excavation, museum screen should appear automatically
5. Verify artifact grid shows all collected items with icons, names, values
6. Verify funding summary shows correct total (10 valuable @ $100 = $1000, 5 junk @ $0-10)
7. Click "Continue to Next Level"
8. Verify player wallet updated with funding
9. Verify level 2 loads with cleared artifact inventory
10. Verify museum collection persists (check gameState.museum.collection)

### Expected Behavior
- Museum appears **immediately** after last POI excavated
- Input completely blocked during museum display (cannot move/use tools)
- All collected artifacts visible in museum grid
- Funding calculation accurate ($100 per valuable artifact, $0-10 per junk)
- Continue button advances to next level without additional confirmation
- Artifacts move from player.artifacts to museum.collection
- Player wallet balance persists across levels
- Game state automatically saved to localStorage

### Edge Cases
- **No artifacts collected**: Museum shows "No artifacts were collected this level" message
- **Level 10 completion**: Caps at level 10, does not advance to level 11
- **Browser refresh**: gameState persists via localStorage, museum state preserved

## Related Documentation
- Architecture: Main CLAUDE.md (module dependencies, game loop)
- Feature: `.docs/features/minimap-terrain.doc.md` (fog-of-war system)
- Implementation files: `game.js`, `museum.js`, `gameState.js`, `toolSystem.js`
