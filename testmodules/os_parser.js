import { CLI } from './os_terminal.js';
import { STUDIO } from './os_studio.js';

const canvas = document.getElementById('screen');
const mobileKeyboard = document.getElementById('mobile-keyboard');

// =========================================================
// 1. DESKTOP INPUT & SYSTEM HOTKEYS
// =========================================================
window.addEventListener('keydown', (e) => {
    // --- BREAK COMMAND (Halt running code) ---
    // Drops out of the execution loop and returns to terminal
    if (e.key === "End" && RAM.isRunning) {
        RAM.isRunning = false;
        CLI.print("?BREAK");
        CLI.newLine();
        return; // Stop processing other keys
    }

<<<<<<< HEAD
// Boot Sequence
APU.init();
GPU.init();
STUDIO.init();

// =========================================================
// DESKTOP & MOBILE INPUT HANDLING
// =========================================================
const canvas = document.getElementById('screen');
const mobileKeyboard = document.getElementById('mobile-keyboard');

// 1. Desktop Input & Hotkeys
window.addEventListener('keydown', (e) => {
    // Halt running code (PC)
    if (e.key === "End" && RAM.isRunning) {
        RAM.isRunning = false;
        CLI.printLine("?BREAK");
        CLI.printLine("READY.");
        return; 
    }

    // Toggle Studio
    if (e.key === "Escape") {
        if (STUDIO.isOpen) STUDIO.close();
        else STUDIO.open();
        return; 
    }

    // Normal typing (only if not running and studio closed)
    if (!RAM.isRunning && !STUDIO.isOpen) {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
=======
    // --- STUDIO TOGGLE ---
    // Opens or closes the native IDE overlay
    if (e.key === "Escape") {
        if (STUDIO.isOpen) {
            STUDIO.close();
        } else {
            STUDIO.open();
        }
        return; // Stop processing other keys
    }

    // --- TERMINAL TYPING (Desktop) ---
    // Only accept typing if code is NOT running and Studio is closed
    if (!RAM.isRunning && !STUDIO.isOpen) {
        
        // Prevent default browser scrolling when using Space or Arrow keys
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
        
        // Route standard characters and terminal actions (Backspace/Enter)
        // Ignoring single modifier keys (like just pressing 'Shift' or 'Alt')
>>>>>>> 241f6dc7f84e00b8ff0f2f54df8897e712d41079
        if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
            CLI.handleKey(e.key);
        }
    }
});

<<<<<<< HEAD
// 2. Mobile Input
if (canvas && mobileKeyboard) {
    // Bring up the hidden keyboard on tap
    canvas.addEventListener('pointerdown', (e) => {
        if (!RAM.isRunning && !STUDIO.isOpen) {
            mobileKeyboard.focus();
        }
    });

    // Intercept predictive text and mobile keys
    mobileKeyboard.addEventListener('input', (e) => {
        if (!RAM.isRunning && !STUDIO.isOpen) {
            let val = mobileKeyboard.value;
            if (val.length > 0) {
                let char = val[val.length - 1]; 
                if (char === '\n') CLI.handleKey("Enter");
                else CLI.handleKey(char); 
                
                mobileKeyboard.value = ""; 
            }
        }
    });

    // Catch explicit backspace/enter on mobile
    mobileKeyboard.addEventListener('keydown', (e) => {
        if (!RAM.isRunning && !STUDIO.isOpen) {
            if (e.key === "Backspace" || e.key === "Enter") {
                CLI.handleKey(e.key);
                e.preventDefault(); 
            }
        }
    });

    // 3-Finger Tap to Break Code (Mobile)
    canvas.addEventListener('touchstart', (e) => {
        if (RAM.isRunning && e.touches.length >= 3) {
            RAM.isRunning = false; 
            CLI.printLine("?BREAK");
            CLI.printLine("READY.");
            e.preventDefault(); 
        }
    }, { passive: false });
}
=======
// =========================================================
// 2. MOBILE INPUT HANDLING
// =========================================================

// --- ACTIVATE MOBILE KEYBOARD ---
// When the screen is tapped, snap cursor and focus the hidden textarea
canvas.addEventListener('pointerdown', (e) => {
    if (!RAM.isRunning && !STUDIO.isOpen) {
        // Calculate canvas scale in case CSS stretches it
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const touchX = Math.floor((e.clientX - rect.left) * scaleX);
        const touchY = Math.floor((e.clientY - rect.top) * scaleY);
        
        // Snap the cursor to where they tapped (assuming setCursor exists in your CLI)
        if (typeof CLI.setCursor === "function") {
            CLI.setCursor(touchX, touchY);
        }
        
        // Force the invisible mobile keyboard to slide up
        mobileKeyboard.focus();
    }
});

// --- INTERCEPT MOBILE TYPING ---
// Reads the hidden textarea value to bypass mobile predictive text issues
mobileKeyboard.addEventListener('input', (e) => {
    if (!RAM.isRunning && !STUDIO.isOpen) {
        let val = mobileKeyboard.value;
        if (val.length > 0) {
            let char = val[val.length - 1]; 
            
            // Some mobile keyboards send newlines instead of 'Enter'
            if (char === '\n') {
                CLI.handleKey("Enter");
            } else {
                CLI.handleKey(char); 
            }
            
            // Clear the hidden box immediately to stay ready for the next character
            mobileKeyboard.value = ""; 
        }
    }
});

// --- CATCH MOBILE SYSTEM KEYS ---
// Backspace and Enter don't always trigger standard 'input' events on mobile
mobileKeyboard.addEventListener('keydown', (e) => {
    if (!RAM.isRunning && !STUDIO.isOpen) {
        if (e.key === "Backspace" || e.key === "Enter") {
            CLI.handleKey(e.key);
            e.preventDefault(); 
        }
    }
});

// --- MOBILE BREAK COMMAND (Two-finger tap) ---
// Halts running code gracefully on touch devices
canvas.addEventListener('touchstart', (e) => {
    // e.touches.length detects how many fingers are currently on the screen
    if (RAM.isRunning && e.touches.length >= 2) {
        RAM.isRunning = false; 
        
        CLI.print("?BREAK");
        CLI.newLine();
        
        // Prevent the browser from trying to zoom or scroll
        e.preventDefault(); 
    }
}, { passive: false }); // passive: false is required to let preventDefault() work
>>>>>>> 241f6dc7f84e00b8ff0f2f54df8897e712d41079
