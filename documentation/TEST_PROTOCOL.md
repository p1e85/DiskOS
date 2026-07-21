DiskOS v1.9 - Master QA Protocol
Environment: DiskOS Browser Engine
Target: v1.9 Fantasy Console Architecture
Objective: Verify memory retention, UI state integrity, Web Audio sequencing, and multi-format file system operations.

PHASE 1: System Boot & CLI Diagnostics
Tests the baseline terminal parser, variables, and basic commands.

Boot the Engine. Ensure the blinking cursor is active and responding.

Test Basic Input:

Type HELLO WORLD and press ENTER.

Expected: ?SYNTAX ERROR

Test CLI Clear:

Type CLEAR_SCR

Expected: Screen wipes, cursor resets to the top left.

Test Menu Command:

Type $FILE NEW

Expected: Output MEMORY CLEARED. THEME RESET.

PHASE 2: Code Memory & .diskCODE Processing
Tests the standard BASIC parser, line ordering, and code-only saving.

Write a diagnostic loop:

Basic
10 PRINT "--- CPU TEST ---"
20 LET A = 1
30 PRINT "ITERATION: " + A
40 LET A = A + 1
50 IF A < 5 THEN GOTO 30
60 PRINT "TEST COMPLETE."
Test Execution:

Type RUN

Expected: Prints Iterations 1 through 4, then "TEST COMPLETE."

Test Code File System:

Type SAVE LOOP.diskCODE

Type NEW (Verify LIST returns "MEMORY IS EMPTY.")

Type LOAD LOOP.diskCODE

Type LIST

Expected: The code is restored perfectly in numerical order.

PHASE 3: RAW Mode & Alternate Formats (.diskGUI / .diskPAD)
Tests the raw string buffer bypassing the BASIC line-number parser.

Enter RAW Mode:

Type ----

Expected: RAW MODE: ON (APPENDING)

Input RAW Data:

Type: [WINDOW_MAIN]

Type: WIDTH=300

Type: HEIGHT=200

Exit RAW Mode:

Type ----

Expected: RAW MODE: OFF (3 LINES TOTAL)

Test RAW File System:

Type SAVE LAYOUT.diskGUI

Type NEW

Type LOAD LAYOUT.diskGUI

Type LIST

Expected: Prints the RAW DATA MEMORY block with your exact strings. No ?SYNTAX ERROR should trigger during the load.

PHASE 4: The Studio UI & Audio Engine
Manual hardware verification of the ESC overlay UI.

4A. Sprite Editor (■)
Press ESC to open SPRITE STUDIO.

Architecture Toggle: Click 16-BIT. Verify grid expands to 16x16 and palette expands to 256 colors. Switch back to 8-BIT.

Drawing: Select Slot 1 in the Cartridge Bank. Draw a smiley face in Yellow (#FFEC27).

Slot Switching: Click Slot 2. Verify the canvas clears. Draw a red box. Click back to Slot 1 to verify the smiley face was retained in memory.

4B. Map Builder (▦)
Press ESC to cycle to MAP BUILDER.

Stamping: Select Sprite Slot 1 (your smiley face) from the left sidebar.

Click and drag across the Map Canvas.

Expected: Smiley faces tile seamlessly across the grid. The right sidebar thumbnail for Map 0 should update.

4C. SFX Tracker (♫)
Press ESC to cycle to SFX TRACKER.

Sequencing: Draw a diagonal line from bottom-left to top-right on the 32-step canvas (an ascending sweep).

Playback: Click ▶ PLAY SFX.

Synth Controls:

Change Waveform to SAWTOOTH. Play again. (Should sound harsh/buzzy).

Change Speed to 20. Play again. (Should sweep very slowly).

4D. Music Tracker (♬)
Press ESC to cycle to MUSIC TRACKER.

Stamping SFX: Click your active SFX stamp on the left (Slot 0).

Arrangement:

Click Step 00 under CH 0.

Click Step 08 under CH 1.

Click Step 16 under CH 2.

Click Step 24 under CH 3.

Playback: Click ▶ PLAY PATTERN.

Expected: You should hear your sweeping sound effect trigger 4 times in a row, cascading across the audio channels perfectly in time.

PHASE 5: Cartridge Data Integration (.diskCART)
The ultimate test of the master payload generator. Ensures Code, Sprites, Maps, SFX, and Music are all successfully packed into a single JSON/Text file payload and unpacked correctly.

Exit the Studio: Press ESC to return to the Terminal.

Write Boot Code:

Basic
10 PRINT "LOADING SUPER GAME..."
20 PRINT "ASSETS VERIFIED."
Save the Cartridge:

Type SAVE SUPERGAME.diskCART

Nuke the Memory:

Type NEW

Press ESC through all Studio tabs. Verify Canvas is blank, Maps are blank, Audio is silent, grids are empty.

Load the Cartridge:

Return to Terminal.

Type LOAD SUPERGAME.diskCART

Expected output:

LOADING SUPERGAME.diskCART...
LOADED 2 LINES.
LOADED CART DATA.
READY.
Verify Payload Integrity:

Press ESC to open SPRITES. -> Is the smiley face there?

Press ESC to open MAPS. -> Is the level map there?

Press ESC to open SFX. -> Is the sweep sequence there?

Press ESC to open MUSIC. -> Are the 4 channel triggers there?

PHASE 6: Virtual File System & Directories (.diskDIR)
Tests the mounting and directory navigation system.

Test Directory View:

Type DIR

Expected: A list of all files you saved during this session (LOOP.diskCODE, LAYOUT.diskGUI, SUPERGAME.diskCART).

Test Physical Export:

Type EXPORT SUPERGAME.diskCART

Expected: Your browser should download SUPERGAME.diskCART to your physical hard drive. Open it in a standard text editor (like VS Code or Notepad) to verify the structured ===SPRITES===, ===MAPS===, etc., headers exist.

Success Criteria
If Phase 5 results in a 100% restoration of all art and audio assets after a NEW wipe, the V1.9 Cartridge Architecture is structurally complete and ready for the DRAW_SPRITE and PLAY_MUSIC BASIC commands.