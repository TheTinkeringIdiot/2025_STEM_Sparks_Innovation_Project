# Tool System

## Overview
The tool system enables players to excavate artifacts from Points of Interest (POIs) using specialized archaeological tools. Each artifact requires a specific tool for extraction, creating a puzzle mechanic where players must match the correct tool to each discovery site.

## User Perspective
When the player approaches a POI (within 1 tile/40px), they press the spacebar to use their currently selected tool. If the tool matches the artifact's requirements, the player successfully extracts it with a confetti celebration and adds it to their inventory. Using the wrong tool triggers a red screen flash and warning message. A second wrong attempt destroys the POI permanently.

The player's movement is blocked during tool animations to prevent exploitation. Hint text appears as a centered dialog box with gold borders, explaining tool requirements or errors with proper word wrapping for readability.

## Data Flow
1. **Player Input**: Spacebar key press triggers `toolSystem.useTool()` in game loop
2. **Proximity Check**: System checks if player is within 1 tile of any undiscovered POI using Manhattan distance
3. **Tool Validation**: Compares player's current tool against artifact's required tool from `ARTIFACT_CATALOG`
4. **Correct Tool Path**:
   - Confetti particles emit at POI world coordinates
   - Artifact added to `gameState.player.inventory`
   - Money incremented based on artifact value ($100 valuable, $0-10 junk)
   - POI marked as `discovered: true`
   - Flash effect triggers green success
5. **Wrong Tool Path**:
   - Red flash effect activates
   - `wrongAttempts` counter increments on POI
   - Hint text displayed explaining correct tool needed (3s duration with 0.5s fade)
   - Second wrong attempt: POI removed from level, permanent loss
6. **Animation System**: Tool animation plays (500ms duration blocks movement)
7. **UI Updates**: HUD renderer displays updated money, inventory, and hint dialogs

## Implementation

### Key Files
- `game.js` - Game loop integration, spacebar input handling, tool system initialization
- `toolSystem.js` - Core tool logic, POI interaction, artifact extraction, hint dialogs
- `gameState.js` - ARTIFACT_CATALOG (artifact definitions), TOOL_UNLOCKS (progression), player inventory state
- `levelGenerator.js` - Level-aware artifact assignment ensuring only available tools required
- `visualEffects.js` - FlashEffect and ConfettiSystem for success/failure feedback
- `hudRenderer.js` - Money display and inventory rendering
- `minimap.js` - POI marker visualization on minimap

### Tool Unlock Progression
- **Level 1**: Shovel (starting tool)
- **Level 2+**: Pickaxe
- **Level 3+**: Brush
- **Level 4+**: Hammer & Chisel

Artifacts are only assigned to POIs if their required tool is available at the current level (implemented in `levelGenerator.assignArtifactToPOI()`).

### Coordinate Systems
- POIs stored in tile coordinates (`poi.position.x/y`)
- Player position in world pixels (converted to tiles for proximity: `Math.floor(pos / 40)`)
- Confetti emits at world pixel coordinates (`tileX * 40 + 20` for center)

### State Management
```javascript
// POI structure
{
  id: number,
  position: { x: tileX, y: tileY },
  discovered: boolean,
  wrongAttempts: number,
  artifact: {
    id: string,        // e.g., 'amphora', 'denarius_coin'
    isValuable: boolean
  }
}

// Artifact catalog entry
{
  name: string,
  description: string,
  requiredTool: 'shovel' | 'pickaxe' | 'brush' | 'hammer_chisel',
  value: number,
  rarity: string
}
```

## Configuration
- POI proximity threshold: 1 tile (40px Manhattan distance)
- Tool animation duration: 500ms (blocks movement)
- Hint text display: 3000ms with 500ms fade out
- Wrong attempt limit: 2 attempts (1st warning, 2nd destroys)
- POI spacing: 10 tiles minimum (400px) for better distribution

## Usage Example
```javascript
// Tool system initialization in Game constructor
this.toolSystem = new ToolSystem(
  this.gameState,
  this.animator,      // Character animation system
  this.flashEffect,   // Red/green screen flashes
  this.confettiSystem // Particle effects
);

// Game loop integration
update(deltaTime) {
  // Handle spacebar input
  if (input.keys.space && !this.toolSystem.isToolAnimating()) {
    this.toolSystem.useTool();
  }

  // Block movement during animations
  if (!this.toolSystem.isToolAnimating()) {
    this.updatePlayerMovement(input, deltaSeconds);
  }

  // Update tool animations and effects
  this.toolSystem.update(deltaTime);
}

// Rendering hint dialogs
renderUI(ctx) {
  this.toolSystem.renderHint(ctx, canvasWidth, canvasHeight);
}
```

## Testing
- **Manual Test 1 - Correct Tool**:
  1. Start level 1 with shovel equipped
  2. Approach POI requiring shovel (check with console: `gameState.level.pois`)
  3. Press spacebar
  4. Expected: Green flash, confetti, money +$100, artifact in inventory

- **Manual Test 2 - Wrong Tool First Attempt**:
  1. Approach POI requiring pickaxe with shovel equipped
  2. Press spacebar
  3. Expected: Red flash, hint dialog "This artifact requires: Pickaxe", POI remains

- **Manual Test 3 - Wrong Tool Second Attempt**:
  1. Continue from Test 2, press spacebar again with wrong tool
  2. Expected: Red flash, hint dialog "POI destroyed", POI removed from level permanently

- **Manual Test 4 - Movement Blocking**:
  1. Approach POI, press spacebar
  2. Try WASD keys during 500ms animation
  3. Expected: Player does not move until animation completes

## Related Documentation
- Architecture: `.claude/docs/architecture/game-loop.md` (if exists)
- State Management: `gameState.js` (ARTIFACT_CATALOG, TOOL_UNLOCKS)
- Visual Effects: `visualEffects.js` (FlashEffect, ConfettiSystem)
- Level Generation: `levelGenerator.js` (artifact assignment algorithm)
