# DiskOS V1.0 - Developer Reference Manual

DiskOS is a lightweight, mobile-ready fantasy console and 8-bit execution engine built entirely on web technologies. It features a 64x32 grid-based video RAM (VRAM), a custom BASIC-inspired scripting language (`diskCODE`), hardware input polling, and a built-in Web Audio synthesizer.

## ⚙️ System Architecture

* **Display:** 64 x 32 character grid (each cell is 16x24 pixels).
* **Palette:** 9 Retro Colors (`RED`, `BLUE`, `AMBER`, `GREEN`, `WHITE`, `BLACK`, `YELLOW`, `PURPLE`, `CYAN`).
* **Execution Speed:** Overclocked CPU handles up to 1000 instructions per frame at 60 FPS (pauses on `WAIT` or `GET_KEY`).
* **Storage:** Local Browser Storage saving to `.diskCODE` files.

---

## 💻 System Commands (OS Level)

These commands manage the OS state, memory, and files. They are typically typed directly into the terminal, but some (like `CLEAR_SCR` and `LOAD_LIB`) are used inside scripts.

* `HELP` - Displays the built-in quick reference guide.
* `RUN` - Executes the code currently in the memory buffer.
* `LIST` - Prints all code currently in memory to the screen.
* `NEW` - Wipes all code, arrays, variables, and sprites from memory.
* `SAVE "FILENAME.disk"` - Prompts a download of your current memory buffer as a physical file.
* `LOAD` - Opens a file browser to load a `.disk` or `.diskCODE` file from your device into memory.
* `LOAD_LIB [FILENAME]` - "Stacks" a saved file from local storage into your current memory buffer without erasing existing code.
* `COPY` - Copies the entire memory buffer to your device's clipboard.
* `COPY [LINE_NUM]` - Copies a specific line of code.
* `CLEAR_SCR` - Instantly wipes all text and background colors from the VRAM grid.

---

## 📜 diskCODE Language Reference

`diskCODE` requires line numbers for every execution line (e.g., `10 PRINT "HELLO"`). 

### 1. Variables & Math
* **`VAR [NAME] = [VALUE/MATH]`**: Assigns a variable. Supports basic math and logic.
    * *Example:* `10 VAR X = 5 + 10`
* **`DIM [NAME] [SIZE]`**: Creates a memory array filled with 0s.
    * *Example:* `10 DIM ENEMIES 10`
    * *Usage:* `20 VAR ENEMIES[0] = 5`
* **`RND([MAX])`**: Generates a random number between 0 and your maximum.
    * *Example:* `10 VAR X = RND(64)`

### 2. Logic & Flow Control
* **`IF [CONDITION] THEN [ACTION]`**: Evaluates logic (`>`, `<`, `==`, `AND`, `OR`). The action can be `GOTO`, `END`, or `VAR`.
    * *Example:* `10 IF X > 50 AND Y == 10 THEN GOTO 30`
    * *Example:* `20 IF TOUCH_ACTIVE == 1 THEN VAR X = X + 1`
* **`GOTO [LINE_NUM]`**: Jumps execution to a specific line number.
* **`WAIT [MILLISECONDS]`**: Halts the CPU loop for a specific duration, allowing the screen frame to render. Essential for game loops.
    * *Example:* `10 WAIT 30` (Runs at approx 33 FPS)
* **`END`**: Safely terminates the running program.

---

## 🎮 Graphics & Display Engine

* **`PRINT [TEXT/VAR]`**: Prints text to the screen at the current cursor position. Wrap strings in quotes.
    * *Example:* `10 PRINT "SCORE:"`
* **`PLOT [X] [Y] [COLOR]`**: Paints the background of a single grid cell.
    * *Example:* `10 PLOT 32 16 RED`
* **`DRAW_BOX [X] [Y] [W] [H] [COLOR]`**: Draws a solid rectangle.
    * *Example:* `10 DRAW_BOX 0 0 64 5 BLUE`

### The Sprite Engine
Sprites are defined via a binary string. `1` paints the pixel with the chosen color, `0` is treated as transparent.
* **`DEF_SPRITE [ID] [W] [H] [COLOR] [BINARY_DATA]`**: Loads a sprite into memory.
    * *Example:* `10 DEF_SPRITE 1 5 5 CYAN 0010001110111111010110001`
* **`DRAW_SPRITE [ID] [X] [Y]`**: Stamps a defined sprite onto the grid.

---

## 🕹️ Hardware & Input

DiskOS supports both event-driven input (pausing for a key) and hardware polling (continuous movement).

### Blocking Input
* **`GET_KEY [VAR_NAME]`**: Pauses the entire OS and waits for the user to press any key, storing the key string in the variable.
    * *Example:* `10 GET_KEY K`

### Continuous Hardware Polling (Gamepad & Keyboard)
You can read the physical state of a button at any time. If pressed, it equals `1`. If unpressed, it equals `0`. These automatically map to the physical keyboard AND the mobile touch-overlay gamepad.
* `BTN_UP` (Arrow Up)
* `BTN_DOWN` (Arrow Down)
* `BTN_LEFT` (Arrow Left)
* `BTN_RIGHT` (Arrow Right)
* `BTN_W`, `BTN_A`, `BTN_S`, `BTN_D`
* `BTN_SPACE`
* `BTN_X` (Maps to mobile 'A' button)
* `BTN_Z` (Maps to mobile 'B' button)
    * *Example:* `10 VAR X = X + BTN_RIGHT - BTN_LEFT`

### Touch Screen / Mouse Polling
* **`TOUCH_ACTIVE`**: Equals `1` if the user is touching the screen or clicking the mouse.
* **`TOUCH_X`**: The grid X-coordinate of the touch (0-63).
* **`TOUCH_Y`**: The grid Y-coordinate of the touch (0-31).

---

## 🔊 Audio Synthesizer

Audio runs on a separate hardware thread and does not halt the CPU.
* **`BEEP [FREQUENCY] [DURATION_MS]`**: Plays a raw square wave. Great for math-driven sound effects.
    * *Example:* `10 BEEP 440 100`
* **`PLAY [NOTE] [DURATION_MS]`**: Plays a specific musical note (C3 through B5).
    * *Example:* `10 PLAY C#4 200`

---

## 🧠 Low-Level Memory (Advanced)

* **`POKE [INDEX] [COLOR]`**: Overwrites the raw background color of a VRAM cell by its absolute memory index (0 to 2047).
* **`PEEK [INDEX]`**: Reads the background color of a VRAM cell and stores it in the system variable `PEEK_VAL`.

---

## 📱 Mobile Controls & System UI
* **Open Keyboard:** Tap the screen (when a game is not running).
* **Hardware Break:** Tap the screen with 3 fingers simultaneously, or press `ESC` on a keyboard to force-quit a running script.
* **System Menu:** Long-press the screen for 600ms to open the OS Menu (Copy, Paste, and Gamepad Toggle).