# Stadia Rod Fog Reveal Mechanic

## Overview
The fog of war now only reveals when the stadia rod is equipped as the current tool. Previously, fog revealed automatically during any player movement. This change adds strategic tool switching as players must actively choose between exploration (stadia rod) and artifact excavation (other tools).

## User Perspective
Players must manage their equipped tool to balance two competing needs:
- **Exploration Mode**: Equip stadia rod to reveal unexplored areas and locate POIs
- **Excavation Mode**: Switch to appropriate tool (shovel, pickaxe, brush, hammer/chisel) to excavate discovered POIs

**Key Behaviors:**
- Fog only clears when stadia rod is equipped AND player is moving
- Switching to other tools stops fog revelation (previously explored areas remain visible)
- Players can see discovered POIs in explored areas even without stadia rod equipped
- Tool switching is instant via number keys (1-6) or clicking HUD icons

**Strategic Implications:**
- Players must switch back to stadia rod to continue exploring after excavating an artifact
- Encourages deliberate tool selection rather than autopilot movement
- Creates risk/reward: explore more vs. excavate current discoveries
- Stadia rod becomes an active exploration tool rather than passive inventory item

## Data Flow
1. **Input Processing**: InputManager detects WASD/arrow key movement (game.js:187)
2. **Movement Update**: Player position updated based on velocity and deltaTime (game.js:270-334)
3. **Camera Update**: Camera centers on new player position (game.js:236-239)
4. **Tool Check**: Game checks if current tool is 'stadia_rod' (game.js:246)
5. **Conditional Fog Update**:
   - If stadia rod equipped: FogOfWar.updateFog() called with player position (game.js:247-250)
   - If other tool equipped: Fog update skipped, no new areas revealed
6. **Fog State Return**: updateFog() returns boolean indicating if fog changed
7. **Dirty Flag**: If fog updated or camera moved, fog layer marked dirty for redraw (game.js:254-260)
8. **Rendering**: FogRenderer draws updated fog overlay to screen (game.js:362-366)

## Implementation

### Key Files
- `game.js` - Core game loop with conditional fog updates
  - Lines 244-251: Stadia rod check wrapping fog update logic
  - Line 246: Tool comparison: `if (this.gameState.player.currentTool === 'stadia_rod')`
  - Line 245: `fogUpdated` initialized as false (no update by default)
  - Lines 247-250: FogOfWar.updateFog() only called when stadia rod equipped
  - Lines 254-260: Dirty flag logic handles both camera movement and fog updates

- `gameState.js` - Player state tracking
  - `player.currentTool` property stores equipped tool string ('stadia_rod', 'shovel', etc.)
  - Tool changes update this property via HUD input processing

- `fogOfWar.js` - Fog state management (unchanged)
  - updateFog() method reveals circular area (200px radius) around player position
  - Returns true if fog state changed, false if no new areas revealed
  - Grid-based fog tracking (72x48 tiles, 3 states: unexplored/explored/visible)

- `hudRenderer.js` - Tool selection UI (unchanged)
  - Processes number key input and HUD clicks to change currentTool
  - Updates gameState.player.currentTool when tool selected

### Code Changes
**Before (automatic fog reveal):**
```javascript
// Update fog of war based on player position
const fogUpdated = this.fogOfWar.updateFog(
  this.gameState.player.position.x,
  this.gameState.player.position.y
);
```

**After (conditional fog reveal):**
```javascript
// Update fog of war based on player position (only when stadia rod is equipped)
let fogUpdated = false;
if (this.gameState.player.currentTool === 'stadia_rod') {
  fogUpdated = this.fogOfWar.updateFog(
    this.gameState.player.position.x,
    this.gameState.player.position.y
  );
}
```

### Dirty Flag Logic
The dirty flag system handles two scenarios:
1. **Camera moved**: Both background and fog layers marked dirty (fog re-rendered at new viewport position)
2. **Fog updated without camera move**: Only fog layer marked dirty (rare edge case)

```javascript
// Mark layers as dirty when camera moves or fog updates
if (cameraMoved) {
  this.canvasManager.markDirty('background');
  this.canvasManager.markDirty('fog');
} else if (fogUpdated) {
  // Fog updated but camera didn't move (edge case)
  this.canvasManager.markDirty('fog');
}
```

### Tool State Flow
```
User Input (number key 1-6 or HUD click)
  ↓
HUDRenderer.processInput()
  ↓
gameState.player.currentTool = 'stadia_rod' | 'shovel' | ...
  ↓
Game.update() checks currentTool
  ↓
If 'stadia_rod': FogOfWar.updateFog()
  ↓
Fog layer marked dirty
  ↓
FogRenderer.renderFog() redraws overlay
```

## Configuration
- **Fog Reveal Radius** (fogOfWar.js:20): 200px (5 tiles)
- **Required Tool**: 'stadia_rod' (exact string match in game.js:246)
- **Tool Switch Keys** (inputManager.js): Number keys 1-6 map to inventory slots
- **Tool Unlock**: Stadia rod available from level 1 (gameState.js TOOL_UNLOCKS)

## Usage Example
```javascript
// Player starts with stadia rod equipped
gameState.player.currentTool = 'stadia_rod';

// Update loop
update(deltaTime) {
  // Move player
  this.updatePlayerMovement(input, deltaSeconds);

  // Fog reveals because stadia rod is equipped
  let fogUpdated = false;
  if (this.gameState.player.currentTool === 'stadia_rod') {
    fogUpdated = this.fogOfWar.updateFog(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );
  }
  // fogUpdated = true (new areas revealed)
}

// Player switches to shovel
gameState.player.currentTool = 'shovel';

// Update loop continues
update(deltaTime) {
  // Move player (same position change)
  this.updatePlayerMovement(input, deltaSeconds);

  // Fog does NOT reveal because shovel is equipped
  let fogUpdated = false;
  if (this.gameState.player.currentTool === 'stadia_rod') {
    // Condition false - updateFog() not called
  }
  // fogUpdated = false (no new areas revealed)
}
```

## Testing
**Manual test:**
1. Start new game (python3 -m http.server 8000, navigate to http://localhost:8000)
2. Verify stadia rod is equipped by default (slot 1 highlighted in HUD)
3. Move using WASD/arrows and confirm fog reveals in circular pattern
4. Press '2' to switch to magnifying glass (or other available tool)
5. Continue moving and verify fog does NOT reveal new areas
6. Check that previously explored areas remain visible (fog doesn't reset)
7. Press '1' to re-equip stadia rod
8. Move again and confirm fog revelation resumes
9. Verify tool switching works via both number keys and HUD clicks
10. Test that discovered POIs remain visible when switching tools

**Expected behavior:**
- Fog only reveals when stadia rod equipped
- Switching away from stadia rod stops exploration (previously revealed areas stay visible)
- Switching back to stadia rod resumes exploration from current position
- No performance impact (single string comparison per frame)
- Tool switching is instant with no visual lag
- Minimap updates reflect fog changes only when stadia rod equipped

**Edge cases:**
- Player standing still with stadia rod: fog doesn't expand (movement required)
- Player at world edge with stadia rod: fog reveals up to boundary only
- Rapid tool switching: fog state preserved correctly across switches
- Level transition: stadia rod remains equipped if in inventory for new level

## Related Documentation
- Architecture: CLAUDE.md (game loop structure, delta time handling)
- Core Systems: `fogOfWar.js` (fog state machine), `gameState.js` (player state)
- Input: `inputManager.js` (keyboard input), `hudRenderer.js` (tool selection UI)
- Rendering: `fogRenderer.js` (fog visualization), `canvasManager.js` (dirty flag system)
