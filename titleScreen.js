/**
 * Title Screen and Island Map
 * Manages the game's opening flow: title screen -> island selection -> gameplay
 */

// Island definitions (1 level per island)
const ISLANDS = [
  {
    id: 1,
    name: 'Countryside',
    subtitle: 'Rural Roman Fields',
    color: '#6B8E4E',
    accent: '#8FB86A',
    unlocked: true
  },
  {
    id: 2,
    name: 'Villa Ruins',
    subtitle: 'Roman Forum & Villa',
    color: '#C4975A',
    accent: '#D4AA6E',
    unlocked: true
  },
  {
    id: 3,
    name: 'Harbor Town',
    subtitle: 'Mediterranean Port',
    color: '#7A9EBF',
    accent: '#9AB8D4',
    unlocked: true
  },
  {
    id: 4,
    name: 'Mountain Pass',
    subtitle: 'Alpine Roman Road',
    color: '#8A8A8A',
    accent: '#A5A5A5',
    unlocked: true
  },
  {
    id: 5,
    name: 'Sacred Grove',
    subtitle: 'Temple of Diana',
    color: '#4A7A4A',
    accent: '#5C9A5C',
    unlocked: true
  }
];

class TitleScreen {
  constructor(onIslandSelected) {
    this.onIslandSelected = onIslandSelected;
    this.titleElement = null;
    this.mapElement = null;
  }

  /**
   * Show the title screen
   */
  showTitle() {
    if (!this.titleElement) {
      this.createTitleScreen();
    }
    this.titleElement.style.display = 'flex';
  }

  /**
   * Show the island map
   */
  showIslandMap() {
    if (!this.mapElement) {
      this.createIslandMap();
    }
    this.mapElement.style.display = 'flex';
  }

  /**
   * Hide all screens
   */
  hideAll() {
    if (this.titleElement) this.titleElement.style.display = 'none';
    if (this.mapElement) this.mapElement.style.display = 'none';
  }

  /**
   * Create the title screen overlay
   * @private
   */
  createTitleScreen() {
    this.titleElement = document.createElement('div');
    this.titleElement.id = 'title-screen';
    this.titleElement.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a15 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      font-family: 'Georgia', serif;
    `;

    // Decorative border frame
    const frame = document.createElement('div');
    frame.style.cssText = `
      border: 2px solid rgba(212, 168, 75, 0.3);
      border-radius: 12px;
      padding: 60px 80px;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Archaeological Expedition';
    title.style.cssText = `
      color: #D4A84B;
      font-size: 52px;
      font-weight: bold;
      margin: 0 0 12px 0;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
      letter-spacing: 3px;
    `;

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Uncover the secrets of the ancient world';
    subtitle.style.cssText = `
      color: #8A7A60;
      font-size: 20px;
      font-style: italic;
      margin: 0 0 50px 0;
      letter-spacing: 1px;
    `;

    // Decorative divider
    const divider = document.createElement('div');
    divider.style.cssText = `
      width: 200px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #D4A84B, transparent);
      margin: 0 auto 50px auto;
    `;

    // Start button
    const button = document.createElement('button');
    button.textContent = 'Begin Expedition';
    button.style.cssText = `
      background: linear-gradient(180deg, #5A4A35 0%, #3A2A1A 100%);
      color: #D4A84B;
      border: 2px solid #D4A84B;
      border-radius: 6px;
      padding: 16px 48px;
      font-size: 22px;
      font-family: 'Georgia', serif;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;
    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(180deg, #6A5A45 0%, #4A3A2A 100%)';
      button.style.boxShadow = '0 0 20px rgba(212, 168, 75, 0.3)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(180deg, #5A4A35 0%, #3A2A1A 100%)';
      button.style.boxShadow = 'none';
    });
    button.addEventListener('click', () => {
      this.titleElement.style.display = 'none';
      this.showIslandMap();
    });

    frame.appendChild(title);
    frame.appendChild(subtitle);
    frame.appendChild(divider);
    frame.appendChild(button);
    this.titleElement.appendChild(frame);
    document.body.appendChild(this.titleElement);
  }

  /**
   * Create the island map overlay
   * @private
   */
  createIslandMap() {
    this.mapElement = document.createElement('div');
    this.mapElement.id = 'island-map';
    this.mapElement.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: radial-gradient(ellipse at center, #1a3a5c 0%, #0a1a2e 60%, #050d18 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      font-family: 'Georgia', serif;
      overflow: hidden;
    `;

    // Ocean wave texture (subtle animated CSS)
    const waves = document.createElement('div');
    waves.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background:
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 40px,
          rgba(255, 255, 255, 0.015) 40px,
          rgba(255, 255, 255, 0.015) 80px
        );
      pointer-events: none;
    `;
    this.mapElement.appendChild(waves);

    // Header
    const header = document.createElement('h2');
    header.textContent = 'Choose Your Island';
    header.style.cssText = `
      color: #D4A84B;
      font-size: 36px;
      margin-bottom: 10px;
      text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
      letter-spacing: 2px;
      z-index: 1;
    `;
    this.mapElement.appendChild(header);

    const subheader = document.createElement('p');
    subheader.textContent = 'Select an island to begin your excavation';
    subheader.style.cssText = `
      color: #6A8AA0;
      font-size: 16px;
      font-style: italic;
      margin-bottom: 40px;
      z-index: 1;
    `;
    this.mapElement.appendChild(subheader);

    // Island ring container
    const ringContainer = document.createElement('div');
    ringContainer.style.cssText = `
      position: relative;
      width: 650px;
      height: 650px;
      z-index: 1;
    `;

    // Place islands in a ring
    const centerX = 325;
    const centerY = 325;
    const radius = 240;

    ISLANDS.forEach((island, index) => {
      // Calculate position on circle (-90deg offset so first island is at top)
      const angle = ((index / ISLANDS.length) * Math.PI * 2) - (Math.PI / 2);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const islandEl = this.createIslandElement(island, x, y);
      ringContainer.appendChild(islandEl);
    });

    // Draw connecting dotted lines between islands
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '650');
    svg.setAttribute('height', '650');
    svg.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
    `;

    ISLANDS.forEach((island, index) => {
      const nextIndex = (index + 1) % ISLANDS.length;
      const a1 = ((index / ISLANDS.length) * Math.PI * 2) - (Math.PI / 2);
      const a2 = ((nextIndex / ISLANDS.length) * Math.PI * 2) - (Math.PI / 2);

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', centerX + Math.cos(a1) * radius);
      line.setAttribute('y1', centerY + Math.sin(a1) * radius);
      line.setAttribute('x2', centerX + Math.cos(a2) * radius);
      line.setAttribute('y2', centerY + Math.sin(a2) * radius);
      line.setAttribute('stroke', 'rgba(212, 168, 75, 0.15)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '6,6');
      svg.appendChild(line);
    });

    ringContainer.appendChild(svg);
    this.mapElement.appendChild(ringContainer);
    document.body.appendChild(this.mapElement);
  }

  /**
   * Create a single island element
   * @param {Object} island - Island definition
   * @param {number} x - Center X position in ring container
   * @param {number} y - Center Y position in ring container
   * @returns {HTMLElement} Island element
   * @private
   */
  createIslandElement(island, x, y) {
    const islandSize = 110;

    // Wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      left: ${x - islandSize / 2}px;
      top: ${y - islandSize / 2}px;
      width: ${islandSize}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;

    // Island shape (irregular blob via border-radius)
    const blob = document.createElement('div');
    blob.style.cssText = `
      width: ${islandSize}px;
      height: ${islandSize * 0.7}px;
      background: radial-gradient(ellipse at 40% 40%, ${island.accent} 0%, ${island.color} 70%);
      border-radius: 60% 40% 50% 45% / 55% 50% 45% 50%;
      box-shadow:
        0 4px 15px rgba(0, 0, 0, 0.5),
        inset 0 -8px 15px rgba(0, 0, 0, 0.2),
        inset 0 4px 10px rgba(255, 255, 255, 0.1);
      position: relative;
      transition: box-shadow 0.2s ease;
    `;

    // Beach edge (lighter ring around island)
    const beach = document.createElement('div');
    beach.style.cssText = `
      position: absolute;
      top: -4px; left: -4px;
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      border-radius: 60% 40% 50% 45% / 55% 50% 45% 50%;
      background: transparent;
      border: 3px solid rgba(237, 201, 160, 0.35);
      pointer-events: none;
    `;
    blob.appendChild(beach);

    // Island number
    const number = document.createElement('div');
    number.textContent = island.id;
    number.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.9);
      font-size: 28px;
      font-weight: bold;
      text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
      pointer-events: none;
    `;
    blob.appendChild(number);

    // Island name label
    const label = document.createElement('div');
    label.textContent = island.name;
    label.style.cssText = `
      color: #D4C8A0;
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
      letter-spacing: 1px;
      text-align: center;
    `;

    // Subtitle
    const sub = document.createElement('div');
    sub.textContent = island.subtitle;
    sub.style.cssText = `
      color: #7A8A90;
      font-size: 11px;
      font-style: italic;
      margin-top: 2px;
      text-align: center;
    `;

    // Hover effects
    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.transform = 'scale(1.1)';
      blob.style.boxShadow = `
        0 4px 15px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(212, 168, 75, 0.4),
        inset 0 -8px 15px rgba(0, 0, 0, 0.2),
        inset 0 4px 10px rgba(255, 255, 255, 0.15)
      `;
      label.style.color = '#D4A84B';
    });
    wrapper.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'scale(1)';
      blob.style.boxShadow = `
        0 4px 15px rgba(0, 0, 0, 0.5),
        inset 0 -8px 15px rgba(0, 0, 0, 0.2),
        inset 0 4px 10px rgba(255, 255, 255, 0.1)
      `;
      label.style.color = '#D4C8A0';
    });

    // Click handler
    wrapper.addEventListener('click', () => {
      this.hideAll();
      if (this.onIslandSelected) {
        this.onIslandSelected(island.id);
      }
    });

    wrapper.appendChild(blob);
    wrapper.appendChild(label);
    wrapper.appendChild(sub);
    return wrapper;
  }

  /**
   * Destroy all DOM elements
   */
  destroy() {
    if (this.titleElement) {
      this.titleElement.remove();
      this.titleElement = null;
    }
    if (this.mapElement) {
      this.mapElement.remove();
      this.mapElement = null;
    }
  }
}
