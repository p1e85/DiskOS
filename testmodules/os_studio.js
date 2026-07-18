import { RAM } from './os_memory.js';
import { GPU } from './os_display.js';

export const STUDIO = {
    isOpen: false,
    pixels: new Array(64).fill(0),
    wasRunning: false,
    
    init() {
        // Build the IDE Interface
        this.overlay = document.createElement('div');
        this.overlay.id = "diskos-studio";
        this.overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #0000AA; color: #FFF; font-family: monospace;
            display: none; flex-direction: column; align-items: center; justify-content: center;
            z-index: 10000; box-sizing: border-box;
        `;

        this.overlay.innerHTML = `
            <div style="background:#FFF; color:#000; width:100%; max-width:400px; text-align:center; padding:8px; font-weight:bold; margin-bottom:20px;">
                DISKOS INTEGRATED STUDIO V1.0
            </div>
            
            <div style="margin-bottom:15px; font-size: 18px;">
                VAR NAME: <input type="text" id="studio-var" value="SPRITE1" style="background:#000; color:#0f0; border:2px solid #FFF; font-family:monospace; padding:5px; width: 120px; text-transform: uppercase;">
            </div>

            <div id="studio-grid" style="display: grid; grid-template-columns: repeat(8, 30px); gap: 2px; background:#FFF; border:4px solid #FFF; cursor:crosshair;">
            </div>
            
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button id="studio-clear" style="background:#222; color:#FFF; border:2px solid #FFF; padding:10px 20px; font-family:monospace; font-weight:bold; cursor:pointer;">CLEAR</button>
                <button id="studio-save" style="background:#0f0; color:#000; border:2px solid #FFF; padding:10px 20px; font-family:monospace; font-weight:bold; cursor:pointer;">INJECT TO RAM</button>
            </div>
            <div style="margin-top:20px; color:#CCC;">Press [ESC] to toggle OS / Studio modes</div>
        `;

        document.body.appendChild(this.overlay);

        // Build the drawing grid
        const grid = document.getElementById('studio-grid');
        grid.addEventListener('contextmenu', e => e.preventDefault()); // Block right-click menu

        for (let i = 0; i < 64; i++) {
            let px = document.createElement('div');
            px.style.cssText = `width:30px; height:30px; background:#000; user-select:none;`;
            
            const paint = (e) => {
                if (e.buttons === 1) { // Left click draws
                    this.pixels[i] = 1;
                    px.style.background = '#0f0';
                } else if (e.buttons === 2) { // Right click erases
                    this.pixels[i] = 0;
                    px.style.background = '#000';
                }
            };
            
            px.addEventListener('mousedown', paint);
            px.addEventListener('mouseenter', paint);
            px.addEventListener('contextmenu', e => e.preventDefault()); 
            grid.appendChild(px);
        }

        // Logic bindings
        document.getElementById('studio-clear').addEventListener('click', () => {
            this.pixels.fill(0);
            Array.from(grid.children).forEach(px => px.style.background = '#000');
        });

        document.getElementById('studio-save').addEventListener('click', () => {
            const varName = document.getElementById('studio-var').value.toUpperCase();
            const arrayStr = `[${this.pixels.join(',')}]`;
            
            // 1. Inject directly into the live engine RAM
            RAM.variables[varName] = [...this.pixels];
            
            // 2. Print the exact syntax to the OS terminal so you can copy/paste it to your game file later
            GPU.printLine(`\n> STUDIO EXPORT:`);
            GPU.printLine(`DIM ${varName} 64`);
            GPU.printLine(`VAR ${varName} = ${arrayStr}`);
            GPU.printLine(`> INJECTED TO MEMORY.`);
            
            this.toggle(); 
        });

        // Global Hardware Key Hook
        window.addEventListener('keydown', (e) => {
            if (e.key === "Escape") this.toggle();
        });
    },

    toggle() {
        this.isOpen = !this.isOpen;
        this.overlay.style.display = this.isOpen ? "flex" : "none";
        
        // PICO-8 Hardware trick: Pause the CPU while editing!
        if (this.isOpen) {
            this.wasRunning = RAM.isRunning;
            RAM.isRunning = false; 
        } else {
            if (this.wasRunning) RAM.isRunning = true; 
        }
    }
};