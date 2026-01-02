# Artifact Sidebar

## Overview
The artifact sidebar is an educational UI panel that displays detailed historical information about artifacts when they are excavated. It provides rich educational content about Roman archaeology, transforming each discovery into a learning opportunity without interrupting gameplay. The sidebar appears on the right side of the game canvas and automatically updates when the player successfully excavates an artifact.

## User Perspective
When a player successfully excavates an artifact with the correct tool, the sidebar displays:
- A large emoji icon representing the artifact
- The artifact's name and time period (e.g., "8th century BCE - 3rd century CE")
- Geographic origin (e.g., "Mediterranean Basin")
- A brief description of what the object is
- Historical context explaining how Romans used the artifact
- Archaeological significance describing what it reveals about the past
- A "Did You Know?" fun fact with surprising information
- Gold pulse animation on the sidebar border when a new artifact is discovered

The sidebar displays information for all 15 possible artifacts per level:
- 10 valuable Roman artifacts ($100): amphora, denarius coin, mosaic tile, oil lamp, fibula, strigil, signet ring, fresco fragment, gladius pommel, votive statue
- 5 junk items ($0-10): pottery shard, corroded nail, stone fragment, animal bone, weathered brick

The educational content remains visible until the next artifact is excavated, allowing players to read at their own pace. The sidebar dimensions (280x960px) match the game canvas height, creating a cohesive visual experience.

## Data Flow
1. Player uses the correct tool on a POI, triggering `ToolSystem.handleCorrectTool()`
2. `ToolSystem` marks POI as excavated, adds artifact to player inventory, and updates money
3. `ToolSystem` calls `onArtifactDiscovered(artifactId)` callback with the artifact ID
4. `Game.onArtifactDiscovered` callback invokes `artifactSidebar.showArtifact(artifactId)`
5. `ArtifactSidebar.showArtifact()` retrieves artifact data from `ARTIFACT_INFO` constant
6. Sidebar adds 'artifact-discovered' CSS class to trigger gold pulse animation
7. Sidebar populates DOM with artifact information (name, icon, period, origin, description, context, significance, fun fact)
8. CSS animation removes the 'artifact-discovered' class after 600ms
9. Content remains visible until next artifact is excavated or level resets

The sidebar DOM structure is injected into `#game-wrapper` on initialization, positioned alongside the game canvas container.

## Implementation

### Key Files
- `artifactSidebar.js` (NEW) - Main sidebar class and ARTIFACT_INFO database (301 lines)
  - Lines 8-162: `ARTIFACT_INFO` constant with educational content for all 15 artifacts
  - Lines 164-295: `ArtifactSidebar` class with initialization, display, and reset methods
- `styles.css` - Sidebar styling with blue theme and discovery animation (lines 178-335)
  - Lines 178-335: `#artifact-sidebar` styles, scrollbar, animation, info sections
- `index.html` - Adds artifactSidebar.js script load (line 39) and wraps game in `#game-wrapper` (line 10)
- `game.js` - Initializes sidebar and wires up discovery callback (lines 42, 118-123)
- `toolSystem.js` - Adds `onArtifactDiscovered` callback property and invokes it (lines 53, 247-250)

### DOM Integration
- Sidebar injected into `#game-wrapper` container (created in index.html)
- Structure: `<div id="artifact-sidebar">` with header and scrollable content area
- Positioned using CSS flexbox alongside game canvas
- No canvas rendering - pure DOM/CSS implementation for maintainability

### Educational Content Structure
Each artifact in `ARTIFACT_INFO` contains:
```javascript
{
  name: string,           // Display name (e.g., "Amphora")
  icon: string,          // Emoji representing artifact
  period: string,        // Time period of use
  origin: string,        // Geographic origin
  description: string,   // What the object is
  historicalContext: string,      // How Romans used it
  archaeologicalSignificance: string,  // What it reveals
  funFact: string       // Surprising or memorable detail
}
```

### Styling Details
- Color scheme: Dark blue-gray theme (#1a2025 background, #6ab4d4 headings, #3a5a6a borders)
- Discovery animation: Gold border pulse and glow effect (600ms duration)
- Typography: 11-18px sizes, high contrast for readability
- Scrollbar: Thin custom scrollbar (8px) matching theme
- Sections: Visual separation with borders, padding, and background variations
- Fun fact: Highlighted with special background and dashed border

## Configuration
No environment variables or feature flags. System is always active and automatically displays when artifacts are excavated.

### Constants
- Sidebar dimensions: 280x960px (matches game canvas height)
- Animation duration: 600ms for discovery pulse
- Scroll: Custom scrollbar with theme colors
- Typography: 11-18px font sizes, sans-serif
- Color palette: Blue-gray theme with gold accent on discovery

## Usage Example
```javascript
// Initialize in Game.initialize()
this.artifactSidebar = new ArtifactSidebar();
this.artifactSidebar.initialize();

// Set callback on tool system
this.toolSystem.onArtifactDiscovered = (artifactId) => {
  this.artifactSidebar.showArtifact(artifactId);
};

// In ToolSystem.handleCorrectTool() after adding artifact
if (this.onArtifactDiscovered) {
  this.onArtifactDiscovered(artifact.id);
}

// Reset on new level
this.artifactSidebar.reset();
```

## Testing
- **Manual test**:
  1. Start game and excavate an artifact with the correct tool
  2. Verify sidebar displays with gold pulse animation
  3. Check that all sections appear: icon, name, period, origin, description, historical context, archaeological significance, fun fact
  4. Verify content matches the excavated artifact
  5. Excavate a different artifact type
  6. Verify sidebar updates with new content
  7. Scroll through content if needed (should have custom scrollbar)
  8. Test with all 15 artifact types (10 valuable + 5 junk)
  9. Progress to new level and verify sidebar resets to placeholder

- **Expected behavior**:
  - Gold pulse animation plays only on discovery (600ms)
  - Content remains visible after animation completes
  - Scrollbar appears only when content exceeds 960px height
  - All 15 artifacts have complete educational content
  - Placeholder message shows when no artifact has been excavated
  - Sidebar height matches game canvas (960px)
  - Typography is readable with sufficient contrast
  - Fun fact section has distinct visual styling

## Educational Value
The artifact sidebar transforms the game into an educational experience by providing:
- Authentic historical information about Roman material culture
- Context about daily life, economy, and society
- Archaeological methodology and significance
- Memorable facts that enhance retention
- Vocabulary and concepts from archaeology and ancient history

Content is written at a middle/high school reading level, balancing accessibility with substantive information. Each artifact provides approximately 150-250 words of educational content.

## Related Documentation
- Feature: `artifact-inventory.doc.md` - Toggleable inventory for reviewing all collected artifacts
- Architecture: Root `CLAUDE.md` - Module system and dependency loading order
- Game State: `gameState.js` - `ARTIFACT_CATALOG` definitions and player inventory structure
- Tool System: `toolSystem.js` - Tool usage mechanics and POI excavation logic
