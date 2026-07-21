import { RAM } from './os_memory.js';

export const STUDIO = {
    isOpen: false,
    wasRunning: false,
    
    // Editor State
    activeMode: 'SPRITE', // 'SPRITE' or 'MAP'
    bitMode: 8,           // 8 or 16
    activeColor: 1,       // Selected palette index
    activeSprite: 0,      // Selected sprite slot (0-255)
    isDrawing: false,

    // Classic 16-Color Retro Palette
    palette8: [
        '#000000', '#1D2B53', '#7E2553', '#008751', 
        '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', 
        '#FF004D', '#FFA300', '#FFEC27', '#00E436', 
        '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],

    init() {
        this.overlay = document.createElement('div');
        this.overlay.id = "diskos-studio";
        this.overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #0A0A0A; color: #FFF; font-family: monospace;
            display: none; flex-direction: column; z-index: 10000;
            user-select: none; box-sizing: border-box;
        `;
        document.body.appendChild(this.overlay);

        // Ensure RAM has the data structures we need
        if (!RAM.sprites) RAM.sprites = {};
        if (!RAM.maps) RAM.maps = {};
    },

    toggle(targetMode = 'SPRITE') {
        this.isOpen = !this.isOpen;
        this.overlay.style.display = this.isOpen ? "flex" : "none";
        
        if (this.isOpen) {
            this.activeMode = targetMode;
            this.wasRunning = RAM.isRunning;
            RAM.isRunning = false; 
            this.buildUI();
        } else {
            if (this.wasRunning) RAM.isRunning = true; 
        }
    },

    buildUI() {
        if (this.activeMode === 'SPRITE') this.buildSpriteEditor();
        else if (this.activeMode === 'MAP') this.buildMapEditor(); // Placeholder for next step
    },

    // ==========================================
    // SPRITE EDITOR LOGIC
    // ==========================================
    buildSpriteEditor() {
        const gridRes = this.bitMode; // 8 or 16
        const colors = this.bitMode === 8 ? this.palette8 : this.generate256Palette();
        
        // Setup HTML structure
        this.overlay.innerHTML = `
            <!-- Top Toolbar -->
            <div style="background: #111; border-bottom: 2px solid #333; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #FFB000; font-weight: bold; font-size: 18px; letter-spacing: 1px;">■ SPRITE STUDIO</div>
                
                <!-- Architecture Toggle -->
                <div style="display: flex; gap: 10px; background: #000; padding: 5px; border-radius: 4px; border: 1px solid #333;">
                    <div id="btn-8bit" style="padding: 5px 15px; cursor: pointer; background: ${this.bitMode === 8 ? '#FFB000' : 'transparent'}; color: ${this.bitMode === 8 ? '#000' : '#888'}; font-weight: bold;">8-BIT</div>
                    <div id="btn-16bit" style="padding: 5px 15px; cursor: pointer; background: ${this.bitMode === 16 ? '#FFB000' : 'transparent'}; color: ${this.bitMode === 16 ? '#000' : '#888'}; font-weight: bold;">16-BIT</div>
                </div>
            </div>

            <div style="display: flex; flex: 1; overflow: hidden; padding: 20px; gap: 20px;">
                
                <!-- Left Sidebar: Tools & Palette -->
                <div style="width: 250px; display: flex; flex-direction: column; gap: 20px;">
                    <!-- Palette Box -->
                    <div style="background: #111; border: 2px solid #333; padding: 10px;">
                        <div style="margin-bottom: 10px; font-size: 12px; color: #888;">COLOR PALETTE</div>
                        <div id="palette-grid" style="display: grid; grid-template-columns: repeat(${this.bitMode === 8 ? 4 : 8}, 1fr); gap: 2px;">
                            ${colors.map((hex, i) => `
                                <div class="palette-swatch" data-idx="${i}" style="
                                    aspect-ratio: 1; background: ${hex}; cursor: pointer;
                                    border: 2px solid ${this.activeColor === i ? '#FFF' : '#000'};
                                "></div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Center: Drawing Canvas -->
                <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #080808; border: 2px solid #333; position: relative;">
                    <canvas id="sprite-canvas" width="${gridRes * 20}" height="${gridRes * 20}" style="
                        width: ${gridRes * 30}px; height: ${gridRes * 30}px; 
                        background: #1A1A1A; border: 1px solid #444; 
                        image-rendering: pixelated; cursor: crosshair;
                        box-shadow: 0 0 20px rgba(0,0,0,0.5);
                    "></canvas>
                </div>

                <!-- Right Sidebar: Sprite Cartridge Bank (256 Slots) -->
                <div style="width: 300px; display: flex; flex-direction: column; gap: 10px; background: #111; border: 2px solid #333; padding: 10px;">
                    <div style="font-size: 12px; color: #888; display: flex; justify-content: space-between;">
                        <span>CARTRIDGE BANK</span>
                        <span style="color: #FFB000;">ID: ${this.activeSprite}</span>
                    </div>
                    <div id="sprite-bank" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; overflow-y: auto; flex: 1; padding-right: 5px;">
                        <!-- 256 Slots Generated via JS -->
                    </div>
                </div>
            </div>
        `;

        this.attachSpriteEvents();
        this.renderBank();
        this.renderCanvas();
    },

    attachSpriteEvents() {
        // Mode Toggles
        document.getElementById('btn-8bit').onclick = () => { this.bitMode = 8; this.buildUI(); };
        document.getElementById('btn-16bit').onclick = () => { this.bitMode = 16; this.buildUI(); };

        // Color Selection
        document.querySelectorAll('.palette-swatch').forEach(el => {
            el.onclick = (e) => {
                this.activeColor = parseInt(e.target.dataset.idx);
                this.buildUI(); // Re-render to show active color highlight
            };
        });

        // Canvas Drawing Logic
        const canvas = document.getElementById('sprite-canvas');
        
        const paint = (e) => {
            if (!this.isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // Calculate which grid pixel we clicked
            const x = Math.floor(((e.clientX - rect.left) * scaleX) / 20);
            const y = Math.floor(((e.clientY - rect.top) * scaleY) / 20);
            
            if (x >= 0 && x < this.bitMode && y >= 0 && y < this.bitMode) {
                // Initialize sprite data array if it doesn't exist
                if (!RAM.sprites[this.activeSprite]) {
                    RAM.sprites[this.activeSprite] = new Array(this.bitMode * this.bitMode).fill(0); // 0 = transparent
                }
                
                // Set the pixel to the active color
                const index = y * this.bitMode + x;
                RAM.sprites[this.activeSprite][index] = this.activeColor;
                
                this.renderCanvas();
                this.renderBank(); // Update thumbnail
            }
        };

        canvas.addEventListener('mousedown', (e) => { this.isDrawing = true; paint(e); });
        window.addEventListener('mouseup', () => { this.isDrawing = false; });
        canvas.addEventListener('mousemove', paint);
    },

    renderCanvas() {
        const canvas = document.getElementById('sprite-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const res = this.bitMode;
        const colors = this.bitMode === 8 ? this.palette8 : this.generate256Palette();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= res; i++) {
            ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20, res * 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * 20); ctx.lineTo(res * 20, i * 20); ctx.stroke();
        }

        // Draw pixel data
        const spriteData = RAM.sprites[this.activeSprite] || [];
        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                let colorIndex = spriteData[y * res + x];
                if (colorIndex && colorIndex > 0) { // 0 is transparent
                    ctx.fillStyle = colors[colorIndex];
                    ctx.fillRect(x * 20, y * 20, 20, 20);
                }
            }
        }
    },

    renderBank() {
        const bank = document.getElementById('sprite-bank');
        if (!bank) return;
        let html = '';
        
        // 256 Cartridge Slots
        for (let i = 0; i < 256; i++) {
            let isActive = i === this.activeSprite;
            let hasData = RAM.sprites[i] ? true : false;
            
            html += `
                <div class="bank-slot" data-idx="${i}" style="
                    aspect-ratio: 1; 
                    background: ${isActive ? '#FFB000' : hasData ? '#222' : '#000'};
                    border: 1px solid ${isActive ? '#FFF' : '#333'};
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 8px; color: ${isActive ? '#000' : '#555'};
                ">
                    ${i}
                </div>
            `;
        }
        bank.innerHTML = html;

        // Slot click events
        document.querySelectorAll('.bank-slot').forEach(el => {
            el.onclick = (e) => {
                this.activeSprite = parseInt(e.target.dataset.idx);
                this.buildUI(); // Re-render everything to update UI highlights and canvas
            };
        });
    },

    // Helper: Generates a 256 VGA-style color array for 16-BIT mode
    generate256Palette() {
        let p = ['#000000']; // 0 is transparent
        // Standard RGB color generation logic...
        for(let r=0; r<8; r++) {
            for(let g=0; g<8; g++) {
                for(let b=0; b<4; b++) {
                    p.push(`rgb(${Math.floor(r*255/7)},${Math.floor(g*255/7)},${Math.floor(b*255/3)})`);
                }
            }
        }
        return p;
    },

    buildMapEditor() {
        // Placeholder for the next phase!
        this.overlay.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 24px; color: #FFB000;">▦ MAP BUILDER</div>
                <div style="color: #888; margin-top: 10px;">To be constructed next...</div>
            </div>
        `;
    }
};