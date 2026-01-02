# Tool Educational Sidebar

## Overview
The tool sidebar is an educational UI panel that displays detailed information about archaeological tools when selected. It provides players with real-world context about how each tool is used in professional archaeology, enhancing the game's educational value by explaining the purpose and historical significance of each implement.

## User Perspective
Players see a fixed sidebar panel on the left side of the game canvas that automatically updates when they switch tools using number keys (1-6). The sidebar displays:
- Tool name with an emoji icon
- Brief description of the tool
- Explanation of its archaeological use in field work
- List of benefits and applications
- Historical note providing cultural context

The sidebar is always visible during gameplay and requires no user interaction—it passively educates players as they explore the tool progression system. Content updates instantly when players switch tools using number keys.

## Data Flow
1. Player presses number key (1-6) to select a tool
2. `HudRenderer.processInput()` updates `gameState.player.currentTool` and returns `true` for tool change
3. `Game.update()` detects tool change and calls `toolSidebar.update(currentTool)`
4. `ToolSidebar.update()` retrieves tool information from `TOOL_INFO` constant
5. Sidebar DOM content updates with new tool's educational information
6. If tool ID is invalid or null, displays placeholder text prompting tool selection

## Implementation

### Key Files
- `toolSidebar.js` - Main sidebar system with `TOOL_INFO` educational content and `ToolSidebar` class
- `styles.css` - Sidebar styling with Roman archaeological theme (lines 18-176)
- `index.html` - Wrapped game-container in game-wrapper div, loads toolSidebar.js script (lines 10, 39)
- `game.js` - Initializes toolSidebar and updates on tool selection changes (lines 42, 112-115, 221)

### DOM Structure
The sidebar injects itself as the first child of `#game-wrapper` before `#game-container`:
```
#game-wrapper (flexbox row)
  ├─ #tool-sidebar (280px wide, injected by ToolSidebar)
  │   ├─ .sidebar-header (title: "Tool Guide")
  │   └─ #tool-content (scrollable content area)
  └─ #game-container (existing canvas layers)
```

### Educational Content
`TOOL_INFO` contains detailed information for 6 archaeological tools:
1. **Stadia Rod** (stadia_rod) - Surveying and measurement
2. **Magnifying Glass** (magnifying_glass) - Close inspection and analysis
3. **Shovel** (shovel) - Excavation and overburden removal
4. **Pickaxe** (pickaxe) - Breaking through hard soil layers
5. **Brush** (brush) - Delicate artifact cleaning
6. **Hammer & Chisel** (hammer_chisel) - Freeing embedded artifacts

Each entry includes:
- `name` - Display name
- `icon` - Unicode emoji representation
- `description` - Tool definition
- `archaeologyUse` - Explanation of real archaeological application
- `benefits` - Array of 3 practical uses
- `historicalNote` - Cultural/historical context

### Styling Details
- Panel: 280x960px fixed height, left-aligned
- Background: Gradient from #2a2520 to #1a1815 (dark brown archaeological theme)
- Border: 2px solid #5a4a35 (tan), border-right removed (seamless with canvas)
- Typography: System font stack, hierarchical sizing (18px header, 13px content, 12px details)
- Colors: Gold headings (#d4a84b), tan text (#c0b5a5), muted body (#a09585)
- Scrollbar: Thin custom styling matching theme (#5a4a35 on #1a1815)
- Benefits list: Custom checkmark bullets with green accent (#7a9a5a)
- Historical section: Highlighted background (rgba(90, 74, 53, 0.2)) with italic styling

## Configuration
No environment variables or feature flags. System is always active and updates automatically on tool selection.

### Constants
- Sidebar width: 280px
- Sidebar height: 960px (matches game canvas height)
- Content padding: 16px
- Section gaps: 16px between info blocks
- Scrollbar width: 8px

## Usage Example
```javascript
// Initialize in Game constructor
this.toolSidebar = new ToolSidebar();
this.toolSidebar.initialize();
this.toolSidebar.update(this.gameState.player.currentTool);

// Update when tool changes
const toolChanged = this.hudRenderer.processInput(input, this.gameState);
if (toolChanged) {
  this.canvasManager.markDirty('ui');
  this.toolSidebar.update(this.gameState.player.currentTool);
}

// Reset sidebar (e.g., when starting new level)
this.toolSidebar.reset();
```

## Testing
- **Manual test**:
  1. Start game (stadia rod auto-selected at level 1)
  2. Verify sidebar displays stadia rod information on left side
  3. Press number keys 1-6 to cycle through tools (including locked tools)
  4. Verify sidebar updates instantly with each tool's educational content
  5. Check that all sections render correctly: name, description, use, benefits, historical note
  6. Verify scrollbar appears if content exceeds 960px height
  7. Confirm sidebar doesn't block game canvas or interfere with gameplay
  8. Test at different browser zoom levels to ensure layout stability

- **Expected behavior**:
  - Sidebar always visible during gameplay (non-toggleable)
  - Content updates immediately on tool selection
  - All 6 tools have complete educational information
  - Benefits render as bulleted list with checkmark symbols
  - Historical notes appear in highlighted box with italic text
  - Sidebar seamlessly aligns with game canvas (no gap)
  - Responsive scrolling for longer content
  - No performance impact on game rendering (pure DOM, no canvas overhead)

## Related Documentation
- Architecture: Root `CLAUDE.md` - Game module system and script loading order
- Game State: `gameState.js` - `TOOL_UNLOCKS` defines tool progression by level
- HUD System: `hudRenderer.js` - Tool selection input handling
- Tool System: `toolSystem.js` - Tool mechanics and artifact interaction
