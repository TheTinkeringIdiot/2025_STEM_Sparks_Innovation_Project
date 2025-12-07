# Minimap Real-Time POI Tracking

## Overview

The minimap now tracks POIs (Points of Interest) in real-time, immediately reflecting when artifacts are excavated and removed from the game world. This fix ensures the minimap stays synchronized with the actual game state, providing accurate visual feedback to players.

## User-Facing Behavior

### What Users See

- **Before excavation**: Gold markers appear on the minimap for all discovered POIs (those revealed by fog-of-war)
- **After excavation**: POI markers instantly disappear from the minimap when artifacts are collected
- **Fog integration**: POI markers only appear for areas already explored (not unexplored areas)

### User Experience Impact

- **Immediate feedback**: Players see visual confirmation on the minimap when they successfully excavate an artifact
- **Progress tracking**: The minimap serves as a visual checklist showing which POIs remain to be excavated
- **Exploration aid**: Helps players navigate to remaining uncollected artifacts

## Technical Implementation

### Data Flow

```
Game State Update (artifact excavated)
    ↓
gameState.level.pois array updated (POI removed)
    ↓
hudRenderer.render() passes live pois array
    ↓
minimap.update() receives current pois
    ↓
minimap._renderPOIs() only draws existing POIs
    ↓
POI disappears from minimap immediately
```

### Key Changes

#### 1. Minimap Update Method Signature Change

**File**: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/minimap.js` (lines 113-117)

The `update()` method now accepts an optional `pois` parameter:

```javascript
update(fog, playerTileX, playerTileY, timestamp, levelGrid, pois) {
  // Update POIs if provided (for real-time POI removal tracking)
  if (pois !== undefined) {
    this.pois = pois;
  }
  // ... rest of update logic
}
```

**Why this matters**: The minimap previously cached POIs via `setPOIs()` during level initialization. By accepting the live array on each update, the minimap now reflects real-time changes.

#### 2. HUD Renderer Integration

**File**: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/hudRenderer.js` (line 114)

The HUD renderer now passes the live POI array to the minimap:

```javascript
this.minimap.update(fog, playerTileX, playerTileY, timestamp, gameState.level.grid, gameState.level.pois);
```

**Why this matters**: This is the connection point where live game state flows into the minimap rendering system.

#### 3. POI Position Format Handling

**File**: `/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/minimap.js` (lines 252-254)

Added flexible position property access:

```javascript
// Support both {x, y} and {position: {x, y}} formats
const poiX = poi.position ? poi.position.x : poi.x;
const poiY = poi.position ? poi.position.y : poi.y;
```

**Why this matters**: POI objects in the game use `{position: {x, y}}` format, while the minimap initialization previously assumed direct `{x, y}` properties. This change ensures compatibility with the actual POI data structure.

### Files Involved

1. **`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/minimap.js`**
   - Added `pois` parameter to `update()` method (line 113)
   - Added real-time POI update logic (lines 115-117)
   - Fixed POI position property access (lines 252-254, 259, 264-265)

2. **`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/hudRenderer.js`**
   - Updated `minimap.update()` call to pass `gameState.level.pois` (line 114)
   - Renamed internal variables for consistency (`inventoryBar` → `toolBar`, `unlockedTools` → `tools`)

## Architecture Notes

### Previous Behavior

The minimap used a **snapshot-based** approach:
- POIs were cached via `setPOIs()` during level initialization
- The cached array was never updated during gameplay
- Excavated POIs remained visible on minimap despite being removed from game state

### Current Behavior

The minimap now uses a **live reference** approach:
- POIs are optionally updated on every `update()` call
- The HUD renderer passes the live `gameState.level.pois` array
- When game state removes a POI, the minimap immediately reflects the change

### Performance Considerations

- **Throttling preserved**: Minimap still updates at 500ms intervals (not every frame)
- **Minimal overhead**: POI array reference update is O(1) operation
- **Optional parameter**: The `pois` parameter is optional, maintaining backward compatibility

## Testing Considerations

### Manual Testing

1. **POI excavation test**:
   - Start a level and explore to reveal POIs on minimap
   - Excavate an artifact using the correct tool
   - Verify POI marker disappears from minimap immediately

2. **Multi-POI test**:
   - Reveal multiple POIs (gold markers on minimap)
   - Excavate them in sequence
   - Verify each disappears individually

3. **Fog integration test**:
   - Verify only explored POIs appear on minimap
   - Verify unexplored POIs (in fog) don't appear
   - Verify excavated POIs don't reappear even if explored

### Edge Cases Handled

- **Undefined pois parameter**: Falls back to cached POIs (backward compatible)
- **Position format variations**: Handles both `{x, y}` and `{position: {x, y}}`
- **Empty POI array**: Renders no markers (doesn't crash)
- **Unexplored POIs**: Correctly filters by fog state

## Related Systems

- **Fog of War** (`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/fogOfWar.js`): Determines POI visibility
- **Game State** (`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/gameState.js`): Maintains authoritative POI list
- **Tool System** (`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/toolSystem.js`): Removes POIs when artifacts excavated
- **Level Generator** (`/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/levelGenerator.js`): Creates initial POI array

## Future Enhancements

Potential improvements to consider:

1. **POI state indicators**: Different marker colors for different POI states (undiscovered, discovered, excavated with wrong tool)
2. **Animation**: Fade-out animation when POI is excavated
3. **POI types**: Visual distinction between valuable artifacts and junk
4. **Hover tooltips**: Show POI details when hovering over minimap markers (requires DOM overlay)

## Breaking Changes

None. The changes are backward compatible:
- `pois` parameter is optional
- Previous `setPOIs()` method still works for initialization
- Position format supports both legacy and current structures
