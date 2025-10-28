# Sprite Animation and Pixel Art Generation Research

## Summary

For a browser-based archeology game, programmatic pixel art generation using symmetry/mirroring algorithms provides the most flexible approach for generating placeholders. Animation should use a frame-time-based system with `requestAnimationFrame` and deltaTime for frame-rate independence. Canvas rendering requires specific configuration (`imageSmoothingEnabled: false`, CSS `image-rendering: pixelated`) to maintain crisp pixel art aesthetics. Visual effects like glow and confetti can be implemented either via pre-rendered off-screen canvases (for performance) or libraries like `canvas-confetti`.

## 1. Programmatic Pixel Art Generation Approach

### Recommended Approach: Procedural Generation with Symmetry

**Core Algorithm:**
- Create a half-sized mask (e.g., 20x40px for a 40x40px sprite)
- Fill mask with randomized pixel data using a simple state system (always paint, never paint, random)
- Mirror the mask along the vertical axis to create symmetrical sprites
- Apply post-processing: outlining (black border), color variation, shading

**Implementation Pattern:**

```typescript
interface PixelMask {
  width: number;
  height: number;
  data: (0 | 1 | 2)[]; // 0 = never, 1 = always, 2 = random
}

function generateSymmetricalSprite(
  halfWidth: number,
  height: number,
  colorPalette: string[]
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = halfWidth * 2;
  canvas.height = height;

  // Generate half, mirror, apply colors
  // Return ImageData for caching
}
```

**Key Libraries/Tools:**
- **pixel-sprite-generator** (GitHub: zfedoran/pixel-sprite-generator): JavaScript procedural sprite generator using mask-based approach
- **DataPixels.js** (GitHub: gmattie/Data-Pixels): Runtime pixel art generation with canvas/image element accessors
- **Custom implementation**: Most flexible for game-specific needs (character sprites, POIs, obstacles)

**Alternative: External Tool Workflow**
- **Aseprite**: Industry-standard pixel art editor with sprite sheet export
- **Piskel**: Free browser-based pixel art tool
- Use for higher-quality art, pre-production mockups, or final assets

### Sprite Size Recommendations

- **Character sprite**: 40x40px (8-10px actual character body, rest for padding/animation)
- **POI markers**: 20x20px rhombus/diamond shape
- **Obstacles**: 30x30px to 40x40px depending on type
- **Tool animations**: 24x24px tool overlay on character

## 2. Sprite Sheet Structure for Animated Character

### Layout Structure

```
┌─────────────────────────────────────────────┐
│ IDLE  │ WALK1 │ WALK2 │ WALK3 │ WALK4       │  UP (row 0)
├─────────────────────────────────────────────┤
│ IDLE  │ WALK1 │ WALK2 │ WALK3 │ WALK4       │  DOWN (row 1)
├─────────────────────────────────────────────┤
│ IDLE  │ WALK1 │ WALK2 │ WALK3 │ WALK4       │  LEFT (row 2)
├─────────────────────────────────────────────┤
│ IDLE  │ WALK1 │ WALK2 │ WALK3 │ WALK4       │  RIGHT (row 3)
├─────────────────────────────────────────────┤
│ DIG1  │ DIG2  │ DIG3  │ PICK1 │ PICK2       │  TOOLS (row 4)
├─────────────────────────────────────────────┤
│ BRUSH1│ BRUSH2│ CHISEL1│CHISEL2│             │  TOOLS2 (row 5)
└─────────────────────────────────────────────┘
```

**Dimensions:**
- Total sheet size: 200px × 240px (5 frames × 40px wide, 6 rows × 40px high)
- Each frame: 40px × 40px
- Walk cycle: 4 frames + 1 idle frame per direction
- Tool animations: 2-3 frames per tool action

### Frame Organization

```typescript
interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: 40;
  frameHeight: 40;
  animations: {
    idleUp: { row: 0, startCol: 0, frameCount: 1 };
    walkUp: { row: 0, startCol: 1, frameCount: 4 };
    idleDown: { row: 1, startCol: 0, frameCount: 1 };
    walkDown: { row: 1, startCol: 1, frameCount: 4 };
    idleLeft: { row: 2, startCol: 0, frameCount: 1 };
    walkLeft: { row: 2, startCol: 1, frameCount: 4 };
    idleRight: { row: 3, startCol: 0, frameCount: 1 };
    walkRight: { row: 3, startCol: 1, frameCount: 4 };
    dig: { row: 4, startCol: 0, frameCount: 3 };
    pickaxe: { row: 4, startCol: 3, frameCount: 2 };
    brush: { row: 5, startCol: 0, frameCount: 2 };
    chisel: { row: 5, startCol: 2, frameCount: 2 };
  };
}
```

### Walk Cycle Best Practices

- **4-frame walk cycle**: Contact → Down → Passing → Up positions
- **Frame timing**: 100-150ms per frame (6-10 FPS for walk animation feels natural)
- **Idle frame**: Single frame with slight variation (breathing, stance)
- **Symmetry**: Use horizontal mirroring for left/right if appropriate (saves work)

## 3. Animation State Machine Pattern

### State Machine Architecture

```typescript
type AnimationState =
  | 'idle'
  | 'walking'
  | 'digging'
  | 'pickaxing'
  | 'brushing'
  | 'chiseling';

type Direction = 'up' | 'down' | 'left' | 'right';

interface AnimationController {
  currentState: AnimationState;
  currentDirection: Direction;
  currentFrame: number;
  frameTime: number; // accumulated time
  frameDuration: number; // ms per frame (e.g., 100ms)
  loop: boolean;
}

class CharacterAnimator {
  private state: AnimationController;
  private spriteSheet: SpriteSheet;

  update(deltaTime: number): void {
    this.state.frameTime += deltaTime;

    if (this.state.frameTime >= this.state.frameDuration) {
      this.state.frameTime = 0;
      this.advanceFrame();
    }
  }

  private advanceFrame(): void {
    const anim = this.getCurrentAnimation();
    this.state.currentFrame++;

    if (this.state.currentFrame >= anim.frameCount) {
      if (this.state.loop) {
        this.state.currentFrame = 0;
      } else {
        this.state.currentFrame = anim.frameCount - 1;
        this.onAnimationComplete();
      }
    }
  }

  setState(state: AnimationState, direction?: Direction): void {
    if (this.state.currentState !== state) {
      this.state.currentState = state;
      this.state.currentFrame = 0;
      this.state.frameTime = 0;

      if (direction) {
        this.state.currentDirection = direction;
      }

      // Tool animations don't loop, movement does
      this.state.loop = state === 'walking' || state === 'idle';
    }
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const anim = this.getCurrentAnimation();
    const sx = anim.startCol * this.spriteSheet.frameWidth +
               (this.state.currentFrame * this.spriteSheet.frameWidth);
    const sy = anim.row * this.spriteSheet.frameHeight;

    ctx.drawImage(
      this.spriteSheet.image,
      sx, sy,
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight,
      Math.round(x), // IMPORTANT: Round to whole numbers for performance
      Math.round(y),
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight
    );
  }
}
```

### State Transitions

```typescript
interface StateTransition {
  from: AnimationState;
  to: AnimationState;
  condition: () => boolean;
  priority: number;
}

// Example transition logic
function updateCharacterState(
  animator: CharacterAnimator,
  input: GameInput,
  character: Character
): void {
  // Priority order: tool actions > movement > idle

  if (input.isUsingTool && !character.isToolAnimating) {
    const toolState = getToolAnimationState(character.currentTool);
    animator.setState(toolState, character.direction);
    character.isToolAnimating = true;
    return;
  }

  if (input.isMoving) {
    animator.setState('walking', input.direction);
    return;
  }

  animator.setState('idle', character.direction);
}
```

### Frame-Rate Independence

**Critical Pattern: Use deltaTime**

```typescript
class GameLoop {
  private lastTime: number = 0;

  start(): void {
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number): void {
    // Convert to seconds
    currentTime *= 0.001;

    // Calculate delta time (time since last frame)
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update with deltaTime (in seconds)
    this.update(deltaTime * 1000); // Convert back to ms for animation timing
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(deltaTime: number): void {
    // All animations and movement use deltaTime
    this.animator.update(deltaTime);
    this.updateCharacterPosition(deltaTime);
  }
}
```

**Why this matters:**
- requestAnimationFrame runs at display refresh rate (60Hz, 120Hz, 144Hz)
- Without deltaTime, animations run faster on high-refresh displays
- With deltaTime, a sprite moving at 100px/second maintains speed regardless of FPS

## 4. Canvas Sprite Rendering Best Practices

### Essential Configuration

```typescript
function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')!;

  // CRITICAL: Disable image smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  return ctx;
}
```

**CSS Configuration:**

```css
canvas {
  /* Prevent blurry scaling when canvas is resized via CSS */
  image-rendering: optimizeSpeed;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -o-crisp-edges;
  image-rendering: pixelated;
  -ms-interpolation-mode: nearest-neighbor;
}
```

### Performance Optimizations

**1. Round Coordinates to Whole Numbers**

```typescript
// ALWAYS round sprite positions
ctx.drawImage(
  spriteSheet,
  sx, sy, sw, sh,
  Math.round(x), Math.round(y), // <- CRITICAL for performance
  sw, sh
);
```

**Impact:** Sub-pixel rendering causes significant slowdown on macOS and some browsers.

**2. Use Sprite Sheets (Not Individual Images)**

- Single image = one texture load
- Fewer draw calls = better performance
- Reduces HTTP requests during loading

**3. Culling (Don't Draw Off-Screen Sprites)**

```typescript
function shouldRender(x: number, y: number, width: number, height: number): boolean {
  return !(
    x + width < 0 ||
    x > canvas.width ||
    y + height < 0 ||
    y > canvas.height
  );
}

// In render loop
if (shouldRender(sprite.x, sprite.y, sprite.width, sprite.height)) {
  sprite.render(ctx);
}
```

**4. Layered Canvas Approach (If Needed)**

For complex scenes with static backgrounds:

```typescript
// Background canvas (drawn once or rarely)
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d')!;

// Main game canvas (redrawn every frame)
const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = gameCanvas.getContext('2d')!;

function render(): void {
  // Draw static background canvas onto main canvas
  ctx.drawImage(bgCanvas, 0, 0);

  // Draw dynamic elements
  renderCharacter(ctx);
  renderAnimatedSprites(ctx);
}
```

**5. Batch Rendering by Sprite Sheet**

```typescript
// Group sprites by texture to minimize context switches
const spritesByTexture = new Map<HTMLImageElement, Sprite[]>();

function render(ctx: CanvasRenderingContext2D): void {
  for (const [texture, sprites] of spritesByTexture) {
    for (const sprite of sprites) {
      if (shouldRender(sprite.x, sprite.y, sprite.width, sprite.height)) {
        sprite.render(ctx);
      }
    }
  }
}
```

**6. Pre-render Complex Sprites**

For sprites with effects applied:

```typescript
// Create once, cache
function prerenderGlowingSprite(baseSprite: HTMLImageElement): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d')!;

  offscreen.width = baseSprite.width + 20; // padding for glow
  offscreen.height = baseSprite.height + 20;

  // Apply glow effect once
  ctx.shadowColor = 'yellow';
  ctx.shadowBlur = 10;
  ctx.drawImage(baseSprite, 10, 10);

  return offscreen; // Cache and reuse
}
```

### Grid-Based Rendering Optimization

For archeology game with tile-based movement:

```typescript
interface GridRenderer {
  tileSize: number;
  viewportWidth: number;
  viewportHeight: number;
  cameraX: number;
  cameraY: number;
}

function getVisibleTileRange(renderer: GridRenderer): {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
} {
  // Only render tiles within viewport
  return {
    startCol: Math.floor(renderer.cameraX / renderer.tileSize),
    endCol: Math.ceil((renderer.cameraX + renderer.viewportWidth) / renderer.tileSize),
    startRow: Math.floor(renderer.cameraY / renderer.tileSize),
    endRow: Math.ceil((renderer.cameraY + renderer.viewportHeight) / renderer.tileSize)
  };
}
```

## 5. Visual Effect Techniques

### Glow Effect (POI Rhombus Markers)

**Approach 1: Pre-rendered Off-screen Canvas (Recommended for Performance)**

```typescript
class GlowingPOIMarker {
  private glowCanvas: HTMLCanvasElement;
  private pulseTime: number = 0;

  constructor(private size: number) {
    this.glowCanvas = this.createGlowCanvas();
  }

  private createGlowCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Add padding for glow
    canvas.width = this.size + 30;
    canvas.height = this.size + 30;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw rhombus with glow
    ctx.shadowColor = '#FFD700'; // gold
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#FFA500'; // orange

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - this.size / 2);
    ctx.lineTo(centerX + this.size / 2, centerY);
    ctx.lineTo(centerX, centerY + this.size / 2);
    ctx.lineTo(centerX - this.size / 2, centerY);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  update(deltaTime: number): void {
    // Animate pulse (optional)
    this.pulseTime += deltaTime * 0.001;
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Optional: pulse effect
    const scale = 1 + Math.sin(this.pulseTime * 3) * 0.1;
    const drawSize = this.glowCanvas.width * scale;

    ctx.drawImage(
      this.glowCanvas,
      Math.round(x - drawSize / 2),
      Math.round(y - drawSize / 2),
      drawSize,
      drawSize
    );
  }
}
```

**Approach 2: Real-time Shadow Blur (Simpler but Slower)**

```typescript
function renderGlowingMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  pulsePhase: number
): void {
  ctx.save();

  // Animated glow
  const glowIntensity = 10 + Math.sin(pulsePhase) * 5;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = glowIntensity;

  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x, y + size / 2);
  ctx.lineTo(x - size / 2, y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
```

**Performance Note:** Drawing shadows frequently impacts performance. Pre-render for animated objects or use sparingly.

### Red Flash Effect (Incorrect Dig)

```typescript
class FlashEffect {
  private active: boolean = false;
  private duration: number = 0;
  private maxDuration: number = 300; // ms

  trigger(): void {
    this.active = true;
    this.duration = 0;
  }

  update(deltaTime: number): void {
    if (this.active) {
      this.duration += deltaTime;
      if (this.duration >= this.maxDuration) {
        this.active = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    if (!this.active) return;

    // Fade out over duration
    const alpha = 1 - (this.duration / this.maxDuration);

    ctx.save();
    ctx.globalAlpha = alpha * 0.7; // Max 70% opacity
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(
      Math.round(x - size / 2),
      Math.round(y - size / 2),
      size,
      size
    );
    ctx.restore();
  }
}
```

### Confetti Effect (Correct Artifact Found)

**Approach 1: Use Library (Recommended)**

```typescript
// Install: npm install canvas-confetti
import confetti from 'canvas-confetti';

function celebrateArtifactFound(x: number, y: number): void {
  // Convert canvas coordinates to normalized 0-1 range
  const originX = x / canvas.width;
  const originY = y / canvas.height;

  confetti({
    particleCount: 50,
    angle: 90,
    spread: 70,
    origin: { x: originX, y: originY },
    colors: ['#FFD700', '#FFA500', '#FF6347', '#4169E1'],
    ticks: 200, // How long particles last
    gravity: 1.2,
    scalar: 0.8 // Particle size
  });
}
```

**Approach 2: Custom Particle System**

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  color: string;
  size: number;
  life: number; // 0-1, fades out
  rotation: number;
  rotationSpeed: number;
}

class ConfettiSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, count: number = 30): void {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#4169E1'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward velocity
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime * 0.001; // Convert to seconds

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.rotation += p.rotationSpeed;

      // Fade out
      p.life -= dt * 0.5; // 2 second lifetime

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate(p.rotation);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }
}
```

### Tool Use Animation Overlay

```typescript
class ToolAnimationOverlay {
  private animating: boolean = false;
  private currentFrame: number = 0;
  private frameTime: number = 0;
  private frameDuration: number = 80; // ms per frame
  private toolType: 'shovel' | 'pickaxe' | 'brush' | 'chisel' | null = null;

  startAnimation(tool: typeof this.toolType): void {
    this.toolType = tool;
    this.animating = true;
    this.currentFrame = 0;
    this.frameTime = 0;
  }

  update(deltaTime: number): void {
    if (!this.animating) return;

    this.frameTime += deltaTime;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame++;

      const frameCount = this.getFrameCount(this.toolType);
      if (this.currentFrame >= frameCount) {
        this.animating = false;
        this.onComplete();
      }
    }
  }

  private getFrameCount(tool: typeof this.toolType): number {
    switch (tool) {
      case 'shovel': return 3;
      case 'pickaxe': return 2;
      case 'brush': return 2;
      case 'chisel': return 2;
      default: return 0;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    spriteSheet: HTMLImageElement,
    characterX: number,
    characterY: number
  ): void {
    if (!this.animating || !this.toolType) return;

    // Tool animation frames are in rows 4-5 of sprite sheet
    const toolRow = this.toolType === 'shovel' || this.toolType === 'pickaxe' ? 4 : 5;
    const toolCol = this.getToolStartCol(this.toolType) + this.currentFrame;

    ctx.drawImage(
      spriteSheet,
      toolCol * 40, toolRow * 40, 40, 40,
      Math.round(characterX), Math.round(characterY), 40, 40
    );
  }

  private getToolStartCol(tool: typeof this.toolType): number {
    switch (tool) {
      case 'shovel': return 0;
      case 'pickaxe': return 3;
      case 'brush': return 0;
      case 'chisel': return 2;
      default: return 0;
    }
  }

  private onComplete(): void {
    // Trigger game logic (reveal tile, check if correct, etc.)
  }
}
```

## Considerations

### Pixel Art Generation Gotchas

- **Color palettes matter**: Limit to 4-8 colors per sprite for authentic pixel art feel
- **Readable at small size**: 40x40px is small; test visibility at actual game resolution
- **Mirroring creates constraints**: Asymmetrical details (tools, accessories) need special handling
- **Border/outline critical**: Black outline around sprites improves visibility on varied backgrounds

### Animation Performance

- **Don't animate everything**: Static sprites for obstacles, animated only when necessary
- **Frame budgets**: 60 FPS = 16.67ms per frame; profile rendering to stay under budget
- **Mobile considerations**: Reduce particle counts, simplify effects on lower-end devices
- **Battery drain**: Excessive canvas redraws drain mobile batteries; use selective redrawing

### State Machine Complexity

- **Tool animations block movement**: Character can't move while tool animation plays
- **Interrupt handling**: What happens if player presses multiple tool buttons? Queue or ignore?
- **Direction persistence**: Remember last facing direction when transitioning idle → tool → idle

### Browser Compatibility

- `imageSmoothingEnabled` supported in all modern browsers (IE11+)
- CSS `image-rendering: pixelated` works Chrome 41+, Firefox 65+, Safari 10+
- `requestAnimationFrame` universally supported
- `canvas-confetti` works all modern browsers, no dependencies

### Sprite Sheet Loading

```typescript
function loadSpriteSheet(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Usage
const spriteSheet = await loadSpriteSheet('/assets/character-sprite-sheet.png');
```

**Important:** Wait for sprite sheet to load before starting game loop.

## Next Steps

### Implementation Sequence

1. **Set up canvas rendering pipeline**
   - Create canvas with proper configuration (`imageSmoothingEnabled: false`, CSS)
   - Implement `requestAnimationFrame` game loop with deltaTime
   - Add basic sprite rendering capability

2. **Generate/create placeholder sprite sheet**
   - Option A: Implement procedural generator for quick iteration
   - Option B: Create minimal sprite sheet in Piskel/Aseprite (faster initial setup)
   - Structure: 5 columns × 6 rows, 40px per frame

3. **Build animation system**
   - Implement `CharacterAnimator` class with state machine
   - Add directional movement animations (up/down/left/right + idle)
   - Test frame timing with different `frameDuration` values

4. **Add tool animations**
   - Implement `ToolAnimationOverlay` for shovel/pickaxe/brush/chisel
   - Block character movement during tool animations
   - Hook up to game logic (tile reveal on animation complete)

5. **Implement visual effects**
   - POI marker glow: Pre-render off-screen canvas, add pulse animation
   - Red flash: Simple alpha-faded overlay on incorrect dig
   - Confetti: Either integrate `canvas-confetti` or build custom particle system

6. **Optimize rendering**
   - Implement viewport culling for off-screen sprites
   - Profile frame times, identify bottlenecks
   - Consider layered canvas if background is complex/static

### Testing Priorities

- **Frame rate consistency**: Test on 60Hz, 120Hz, 144Hz displays
- **Visual crispness**: Verify no blurring at 1x, 2x, 3x canvas scale
- **Animation smoothness**: Validate deltaTime independence (throttle CPU to test)
- **Effect performance**: Profile with multiple glowing POIs + confetti simultaneously

### Artistic Refinement (Post-MVP)

- Replace procedural sprites with hand-drawn pixel art
- Add more animation frames for smoother walk cycles
- Implement character customization/color variants
- Add particle effects for tool impacts (dust, sparks, etc.)
