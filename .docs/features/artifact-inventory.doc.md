# Artifact Inventory

## Overview
The artifact inventory is a toggleable UI overlay that displays all artifacts collected by the player during their archaeological expedition. It provides a detailed view of each artifact's name, description, and monetary value, allowing players to review their discoveries at any time without interrupting gameplay.

## User Perspective
Players press the `I` key to open/close the inventory panel, which appears as a centered overlay with a semi-transparent backdrop. The panel displays:
- A scrollable list of collected artifacts with color-coded backgrounds (green for valuable artifacts, brown for junk)
- Each artifact shows its name, value ($), and description
- A footer displays the total count and combined value of all collected artifacts
- Mouse wheel scrolling for lists exceeding the visible area
- Visual indication when no artifacts have been collected yet

The inventory blocks all other game input (movement, tool usage) while open, ensuring players can review their collection without accidental interactions.

## Data Flow
1. Player presses `I` key, triggering `InputManager` to set `keys.i` state to true
2. `ArtifactInventory.processInput()` detects key press edge (down transition) and toggles `isOpen` state
3. `Game.update()` checks if inventory is visible via `artifactInventory.isVisible()`
4. If visible, game blocks movement/tool input and marks UI canvas as dirty
5. `Game.render()` calls `artifactInventory.render()` on the UI canvas layer
6. Inventory queries `gameState.player.artifacts` array for collected artifact IDs
7. For each ID, retrieves artifact data from `ARTIFACT_CATALOG` via `getArtifact()`
8. Renders artifact list with viewport culling and scroll offset
9. Calculates and displays total value from all artifacts in footer

## Implementation

### Key Files
- `artifactInventory.js` - Main inventory system class with rendering and input handling
- `inputManager.js` - Tracks `I` key state (lines 26, 89-91, 126-128)
- `game.js` - Processes inventory toggle and blocks input when open (lines 187-199)
- `gameState.js` - Stores collected artifacts in `player.artifacts` array and `ARTIFACT_CATALOG` definitions
- `index.html` - Loads artifactInventory.js in script order (line 36)
- `tutorial.js` - Tutorial step 6 explains inventory usage (line 51-53)

### Canvas Integration
- Renders on `ui-canvas` layer (4th layer in 5-layer system)
- Uses `canvasManager.markDirty('ui')` when inventory state changes
- Attaches wheel event listener to entities-canvas for scroll handling
- Implements edge-triggered key detection to prevent hold-to-toggle behavior

### Rendering Details
- Panel: 500x450px centered overlay with Roman-themed styling (#2a1810 background, #8b6f47 border)
- Header: 70px with title and close/scroll hints
- Content area: Scrollable with viewport culling for performance
- Footer: 50px fixed separator showing total value
- Scrollbar: Rendered when content exceeds visible height
- Item height: 60px per artifact with 10px gaps
- Typography: Georgia serif for headings, Arial sans-serif for content

## Configuration
No environment variables or feature flags. System is always active and accessible via `I` key binding.

### Constants
- Viewport: 1440x960px (inherited from game viewport)
- Panel dimensions: 500x450px (centered)
- Scroll speed: 40px per wheel tick
- Layout padding: 20px
- Item rendering: 60px height + 10px gap

## Usage Example
```javascript
// Initialize in Game constructor
this.artifactInventory = new ArtifactInventory(
  this.viewportWidth,
  this.viewportHeight
);
this.artifactInventory.attachWheelListener(this.entitiesCanvas);

// Process input in update loop
const input = this.inputManager.getState();
const inventoryToggled = this.artifactInventory.processInput(input);
if (inventoryToggled) {
  this.canvasManager.markDirty('ui');
}

// Block other input when open
if (this.artifactInventory.isVisible()) {
  return; // Skip movement, tool use, etc.
}

// Render on UI layer
if (this.canvasManager.isDirty('ui')) {
  this.artifactInventory.render(
    this.uiCtx,
    this.gameState.player.artifacts
  );
}
```

## Testing
- **Manual test**:
  1. Start game and collect at least 5 artifacts (mix of valuable and junk)
  2. Press `I` key to open inventory
  3. Verify all collected artifacts appear with correct names, values, descriptions
  4. Test mouse wheel scrolling (if >6 artifacts collected)
  5. Verify total value calculation in footer
  6. Press `I` again to close inventory
  7. Verify game input (WASD, spacebar) is blocked while inventory open
  8. Verify inventory shows "No artifacts collected yet" message when empty

- **Expected behavior**:
  - Inventory toggles on/off with single `I` key press (no hold-to-toggle)
  - Scrollbar appears only when content exceeds visible area
  - Total value matches sum of all artifact values
  - Artifact descriptions truncate with ellipsis if too long
  - Color coding: green background for valuable ($100), brown for junk ($0-10)
  - Panel centers correctly on 1440x960 viewport

## Related Documentation
- Architecture: Root `CLAUDE.md` - Canvas layer system and rendering architecture
- Game State: `gameState.js` - `ARTIFACT_CATALOG` structure and player inventory data
- Tutorial: `tutorial.js` - Step 6 introduces inventory feature to new players
