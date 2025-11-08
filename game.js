/**
 * Core Game Loop
 * Implements fixed 60fps physics loop with variable refresh rate rendering
 * Uses requestAnimationFrame with deltaTime tracking for frame-rate independent behavior
 *
 * Architecture:
 * - Physics updates capped at 60fps (16.67ms intervals)
 * - Rendering at display refresh rate (60Hz/120Hz/144Hz)
 * - Separate update and render phases for optimal performance
 */

class Game {
  constructor() {
    // Game loop state
    this.isRunning = false;
    this.animationFrameId = 0;
    this.lastFrameTime = 0;

    // Physics cap at 60fps
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS; // 16.67ms

    // Game state
    this.gameState = null;

    // Systems
    this.canvasManager = null;
    this.inputManager = null;
    this.camera = null;
    this.tileRenderer = null;
    this.fogOfWar = null;
    this.animator = null;
    this.fogRenderer = null;
    this.tutorialManager = null;
    this.minimap = null;
    this.hudRenderer = null;

    // Player movement constants
    this.playerSpeed = 160; // pixels per second (4 tiles per second at 40px/tile)
  }

  /**
   * Initialize all game systems
   * Call this before starting the game loop
   */
  initialize() {
    // Initialize canvas manager (4 layers: background, entities, fog, ui)
    this.canvasManager = new CanvasManager('game-container', 1440, 960);

    // Initialize input manager
    const entitiesLayer = this.canvasManager.getLayer('entities');
    this.inputManager = new InputManager(entitiesLayer.canvas);

    // Initialize camera system
    this.camera = new Camera();

    // Initialize game state
    this.gameState = initializeGameState();

    // Initialize tile renderer (72x48 tiles at 40px each)
    this.tileRenderer = new TileRenderer(72, 48, 40);

    // Initialize fog of war (72x48 tiles, 40px tile size, 200px reveal radius)
    this.fogOfWar = new FogOfWar(72, 48, 40, 200);

    // Initialize fog renderer
    const fogLayer = this.canvasManager.getLayer('fog');
    this.fogRenderer = new FogRenderer(fogLayer.canvas);

    // Initialize tutorial manager
    this.tutorialManager = new TutorialManager();

    // Initialize minimap (72x48 tiles, 150x100px display)
    this.minimap = new Minimap(72, 48, 150, 100);

    // Initialize HUD renderer
    this.hudRenderer = new HUDRenderer(1440, 960, this.minimap);

    // TODO: Initialize animator when sprite sheet is available
    // this.animator = new CharacterAnimator(spriteSheet);

    console.log('Game systems initialized');

    // Load the first level
    this.loadLevel(1);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Game loop already running');
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);

    console.log('Game loop started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    console.log('Game loop stopped');
  }

  /**
   * Main game loop
   * Runs at display refresh rate, but caps physics updates at 60fps
   * @private
   * @param {number} currentTime - Current timestamp from requestAnimationFrame
   */
  loop = (currentTime) => {
    if (!this.isRunning) {
      return;
    }

    // Request next frame early for browser optimization
    this.animationFrameId = requestAnimationFrame(this.loop);

    // Calculate time since last frame
    const deltaTime = currentTime - this.lastFrameTime;

    // Cap physics updates at target FPS (60fps = 16.67ms)
    if (deltaTime >= this.frameInterval) {
      // Account for frame interval excess to maintain timing accuracy
      // This prevents drift over time
      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

      // Update game logic (capped at 60fps)
      this.update(deltaTime);
    }

    // Always render at display refresh rate (even if physics didn't update)
    this.render();
  }

  /**
   * Update phase - runs at fixed 60fps
   * Processes input, updates player state, animations, and fog
   * @private
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Convert deltaTime to seconds for movement calculations
    const deltaSeconds = deltaTime / 1000;

    // Get current input state
    const input = this.inputManager.getState();

    // Process HUD input for tool selection
    const toolChanged = this.hudRenderer.processInput(input, this.gameState);
    if (toolChanged) {
      this.canvasManager.markDirty('ui');
    }

    // Process input and update player movement
    this.updatePlayerMovement(input, deltaSeconds);

    // Update animations (if animator exists)
    if (this.animator) {
      // Note: animator.update expects deltaTime in milliseconds
      this.animator.update(deltaTime);
    }

    // Store previous camera position to detect movement
    const prevCameraX = this.camera.worldX;
    const prevCameraY = this.camera.worldY;

    // Update camera to follow player
    this.camera.centerOn(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );

    // Check if camera moved
    const cameraMoved = (prevCameraX !== this.camera.worldX || prevCameraY !== this.camera.worldY);

    // Update fog of war based on player position
    const fogUpdated = this.fogOfWar.updateFog(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );

    // Mark layers as dirty when camera moves or fog updates
    if (cameraMoved) {
      this.canvasManager.markDirty('background');
      this.canvasManager.markDirty('fog');
    } else if (fogUpdated) {
      // Fog updated but camera didn't move (edge case)
      this.canvasManager.markDirty('fog');
    }
  }

  /**
   * Update player movement based on input
   * Uses time-independent movement: velocity × deltaTime
   * @private
   * @param {Object} input - Input state from InputManager
   * @param {number} deltaSeconds - Delta time in seconds
   */
  updatePlayerMovement(input, deltaSeconds) {
    // Calculate movement vector
    let velocityX = 0;
    let velocityY = 0;

    // Check WASD keys
    if (input.keys.w || input.keys.up) {
      velocityY = -1;
      this.gameState.player.direction = 'up';
    }
    if (input.keys.s || input.keys.down) {
      velocityY = 1;
      this.gameState.player.direction = 'down';
    }
    if (input.keys.a || input.keys.left) {
      velocityX = -1;
      this.gameState.player.direction = 'left';
    }
    if (input.keys.d || input.keys.right) {
      velocityX = 1;
      this.gameState.player.direction = 'right';
    }

    // Normalize diagonal movement (prevent moving faster diagonally)
    if (velocityX !== 0 && velocityY !== 0) {
      const length = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      velocityX /= length;
      velocityY /= length;
    }

    // Apply movement with time-independent velocity
    // Movement = velocity × speed × deltaTime
    const moveX = velocityX * this.playerSpeed * deltaSeconds;
    const moveY = velocityY * this.playerSpeed * deltaSeconds;

    // Calculate new position
    let newX = this.gameState.player.position.x + moveX;
    let newY = this.gameState.player.position.y + moveY;

    // Player boundary collision (16px radius, world is 2880×1920px)
    const playerRadius = 16;
    const worldWidth = this.camera.worldWidth;   // 2880px
    const worldHeight = this.camera.worldHeight; // 1920px

    // Clamp position to world bounds
    newX = Math.max(playerRadius, Math.min(worldWidth - playerRadius, newX));
    newY = Math.max(playerRadius, Math.min(worldHeight - playerRadius, newY));

    // Update player position (round to prevent sub-pixel rendering)
    this.gameState.player.position.x = Math.round(newX);
    this.gameState.player.position.y = Math.round(newY);

    // Update animation state based on movement
    // TODO: Call animator.setState() when animator is available
    // if (velocityX !== 0 || velocityY !== 0) {
    //   this.animator.setState('walking', this.gameState.player.direction);
    // } else {
    //   this.animator.setState('idle', this.gameState.player.direction);
    // }
  }

  /**
   * Render phase - runs at display refresh rate
   * Only redraws layers marked as dirty for optimal performance
   * @private
   */
  render() {
    // Render order (bottom to top):
    // 1. Background layer (tiles) - only if dirty
    // 2. Entities layer (player, POIs) - always redraw
    // 3. Fog layer - only if dirty
    // 4. UI layer (HUD, minimap) - only if dirty

    // 1. Render background layer (static tiles)
    const backgroundLayer = this.canvasManager.getLayer('background');
    if (backgroundLayer.needsRedraw && this.tileRenderer.isPrerendered) {
      this.canvasManager.clearLayer('background');
      this.tileRenderer.renderVisible(backgroundLayer.context, this.camera);
      backgroundLayer.needsRedraw = false;
    }

    // 2. Render entities layer (always redraw for smooth animation)
    const entitiesLayer = this.canvasManager.getLayer('entities');
    this.canvasManager.clearLayer('entities');
    this.renderEntities(entitiesLayer.context);

    // 3. Render fog layer (only if dirty)
    const fogLayer = this.canvasManager.getLayer('fog');
    if (fogLayer.needsRedraw) {
      this.fogRenderer.renderFog(this.fogOfWar, this.camera);
      fogLayer.needsRedraw = false;
    }

    // 4. Render UI layer (only if dirty)
    const uiLayer = this.canvasManager.getLayer('ui');
    if (uiLayer.needsRedraw) {
      this.canvasManager.clearLayer('ui');
      this.renderUI(uiLayer.context);
      uiLayer.needsRedraw = false;
    }
  }

  /**
   * Render entities (player, POIs, etc.)
   * @private
   * @param {CanvasRenderingContext2D} ctx - Entities layer context
   */
  renderEntities(ctx) {
    // Convert player world position to screen position
    const screenPos = this.camera.worldToScreen(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );

    // Render player (placeholder circle until sprite sheet is ready)
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // TODO: Render player sprite when animator is available
    // if (this.animator) {
    //   const frame = this.animator.getCurrentFrame();
    //   ctx.drawImage(
    //     this.animator.spriteSheet.image,
    //     frame.srcX, frame.srcY, frame.width, frame.height,
    //     screenPos.x - 20, screenPos.y - 20, 40, 40
    //   );
    // }

    // Render POIs
    if (this.gameState.level.pois && this.gameState.level.pois.length > 0) {
      this.gameState.level.pois.forEach(poi => {
        // Convert tile coordinates to world coordinates (center of tile)
        const worldX = poi.position.x * 40 + 20;
        const worldY = poi.position.y * 40 + 20;

        // Convert to screen coordinates
        const poiScreenPos = this.camera.worldToScreen(worldX, worldY);

        // Only render if in viewport
        if (poiScreenPos.x < -40 || poiScreenPos.x > 1440 + 40 ||
            poiScreenPos.y < -40 || poiScreenPos.y > 960 + 40) {
          return;
        }

        // Draw POI marker
        if (poi.discovered) {
          // Discovered POI - green circle
          ctx.fillStyle = '#4CAF50';
          ctx.strokeStyle = '#2E7D32';
        } else {
          // Undiscovered POI - golden/yellow circle with glow
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#FFA000';
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(poiScreenPos.x, poiScreenPos.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Add inner detail
        ctx.fillStyle = poi.discovered ? '#81C784' : '#FFEB3B';
        ctx.beginPath();
        ctx.arc(poiScreenPos.x, poiScreenPos.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  /**
   * Render UI elements (HUD, inventory, etc.)
   * @private
   * @param {CanvasRenderingContext2D} ctx - UI layer context
   */
  renderUI(ctx) {
    // Render full HUD with tool inventory and minimap
    this.hudRenderer.render(ctx, this.gameState, this.fogOfWar, performance.now());
  }

  /**
   * Load a level and initialize its systems
   * @param {number} levelNumber - Level number to load (1-10)
   */
  loadLevel(levelNumber) {
    console.log(`Loading level ${levelNumber}...`);

    // 1. Generate level using LevelGenerator
    const levelConfig = {
      seed: levelNumber,
      width: 72,
      height: 48,
      poiCount: 15,
      minPOISpacing: 4,  // 4 tiles spacing (effective 4-8 tiles with Poisson annulus)
      obstacleDensity: 0.3,
      theme: 'roman'
    };

    const levelGenerator = new LevelGenerator(levelConfig);
    const level = levelGenerator.generate();

    // Store level data in game state
    this.gameState.level.number = levelNumber;
    this.gameState.level.island = level.config.theme;
    this.gameState.level.pois = level.pois;
    this.gameState.level.obstacles = level.obstacles || [];

    // Update inventory for level
    updateInventoryForLevel(this.gameState, levelNumber);

    // 2. Pre-render map to background layer
    const backgroundLayer = this.canvasManager.getLayer('background');
    this.tileRenderer.prerenderMap(level.grid);
    this.tileRenderer.renderVisible(backgroundLayer.context, this.camera);

    // 3. Set player spawn position
    this.gameState.player.position.x = level.playerSpawn.x * 40 + 20; // Center of tile
    this.gameState.player.position.y = level.playerSpawn.y * 40 + 20;

    // Center camera on player
    this.camera.centerOn(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );

    // 4. Reset fog of war
    this.fogOfWar.reset();
    this.fogOfWar.updateFog(
      this.gameState.player.position.x,
      this.gameState.player.position.y
    );

    // 5. Mark all layers as dirty to force redraw
    this.canvasManager.markDirty('background');
    this.canvasManager.markDirty('entities');
    this.canvasManager.markDirty('fog');
    this.canvasManager.markDirty('ui');

    // 6. Show tutorial if this is level 1 and tutorial hasn't been completed
    if (this.tutorialManager && this.tutorialManager.shouldShowTutorial(levelNumber)) {
      this.tutorialManager.showTutorial();
    }

    console.log(`Level ${levelNumber} loaded successfully`);
  }

  /**
   * Cleanup and destroy game instance
   */
  destroy() {
    this.stop();

    if (this.inputManager) {
      this.inputManager.destroy();
    }

    console.log('Game destroyed');
  }
}
