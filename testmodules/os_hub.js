import { RAM } from './os_memory.js';
import { STUDIO } from './os_studio.js';
import { BIOS } from './os_bios.js';

export const HUB = {
    activeApp: 0, 
    hideTimeout: null,

    apps: [
        { id: 'OS', icon: '>_', name: 'TERMINAL' },
        { id: 'SPRITE', icon: '■', name: 'SPRITES' },
        { id: 'MAP', icon: '▦', name: 'MAPS' },
        { id: 'SFX', icon: '♫', name: 'TRACKER' },
        { id: 'MUSIC', icon: '♬', name: 'SONGS' } // <-- NEW: Music Tracker
    ],

    init() {
        this.overlay = document.createElement('div');
        this.overlay.id = "diskos-hub";
        this.overlay.style.cssText = `
            position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 15, 15, 0.95); border: 2px solid #444; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.9);
            color: #FFF; font-family: monospace;
            display: none; flex-direction: row; gap: 15px; align-items: center; justify-content: center;
            padding: 15px 25px; z-index: 10020; user-select: none; border-radius: 8px;
            transition: opacity 0.15s ease-out; opacity: 0; pointer-events: none;
        `;
        document.body.appendChild(this.overlay);

        window.addEventListener('keydown', (e) => {
            if (e.key === "Escape") {
                if (typeof BIOS !== 'undefined' && BIOS.isOpen) return; 
                if (this.activeApp === 0 && (RAM.isRunning || RAM.isCapturingRaw)) return; 
                e.preventDefault(); e.stopImmediatePropagation();
                this.cycleApp();
            }
        }, true); 
    },

    cycleApp() {
        this.activeApp = (this.activeApp + 1) % this.apps.length;
        this.render(); this.launchApp(this.activeApp);
    },

    launchApp(index) {
        const app = this.apps[index];
        if (app.id === 'OS') {
            if (STUDIO.isOpen) STUDIO.toggle(); 
        } else {
            if (!STUDIO.isOpen) STUDIO.toggle(app.id);
            else { STUDIO.activeMode = app.id; STUDIO.buildUI(); }
        }
    },

    render() {
        let html = '';
        this.apps.forEach((app, index) => {
            let isActive = (index === this.activeApp);
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <div style="
                        width: 56px; height: 56px; 
                        border: 2px solid ${isActive ? '#FFB000' : '#333'};
                        background: ${isActive ? '#FFB000' : '#111'};
                        color: ${isActive ? '#000' : '#666'};
                        font-size: 24px; font-weight: bold;
                        display: flex; align-items: center; justify-content: center;
                        border-radius: 6px; box-shadow: ${isActive ? '0 0 15px rgba(255, 176, 0, 0.4)' : 'none'};
                        transition: all 0.1s;
                    ">${app.icon}</div>
                    <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: ${isActive ? '#FFB000' : '#555'};">${app.name}</div>
                </div>
            `;
        });

        this.overlay.innerHTML = html; this.overlay.style.display = "flex";
        void this.overlay.offsetWidth; this.overlay.style.opacity = "1";

        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.overlay.style.opacity = "0";
            setTimeout(() => { if (this.overlay.style.opacity === "0") this.overlay.style.display = "none"; }, 150); 
        }, 1200); 
    }
};