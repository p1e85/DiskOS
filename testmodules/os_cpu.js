import { RAM } from './os_memory.js';
import { GPU } from './os_display.js';
import { APU } from './os_audio.js';
import { STUDIO } from './os_studio.js';

export const CPU = {
    evaluateExpression(expr) {
        let safeExpr = expr;

        // 1. Process COLLIDE() first
        safeExpr = safeExpr.replace(/\bCOLLIDE\(([^)]+)\)/g, (match, argsString) => {
            const args = argsString.split(',').map(arg => this.evaluateExpression(arg.trim()));
            if (args.length === 8) {
                const [x1, y1, w1, h1, x2, y2, w2, h2] = args;
                return (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) ? "1" : "0";
            }
            return "0";
        });

        // 2. Inject Variables (Safely handles Arrays and Strings)
        for (const [key, value] of Object.entries(RAM.variables)) {
            let regex = new RegExp(`\\b${key}\\b`, 'g');
            let safeValue = (typeof value === 'string') ? `"${value}"` : (Array.isArray(value) ? JSON.stringify(value) : value);
            safeExpr = safeExpr.replace(regex, safeValue);
        }

        // 3. Built-in Engine Constants/Functions
        safeExpr = safeExpr.replace(/\bRND\((.*?)\)/g, "Math.floor(Math.random() * ($1))");
        safeExpr = safeExpr.replace(/\bTOUCH_ACTIVE\b/g, RAM.touchActive);
        safeExpr = safeExpr.replace(/\bTOUCH_X\b/g, RAM.touchX);
        safeExpr = safeExpr.replace(/\bTOUCH_Y\b/g, RAM.touchY);
        safeExpr = safeExpr.replace(/\bBTN_([A-Z0-9_]+)\b/g, (match, p1) => {
            const mapped = { "SPACE": " ", "UP": "ARROWUP", "DOWN": "ARROWDOWN", "LEFT": "ARROWLEFT", "RIGHT": "ARROWRIGHT" };
            return RAM.keysDown[mapped[p1] || p1] ? "1" : "0";
        });
        
        // 4. Logic Operators
        safeExpr = safeExpr.replace(/\bAND\b/g, "&&").replace(/\bOR\b/g, "||");
        
        try { 
            let res = new Function('return ' + safeExpr)(); 
            return res === true ? 1 : res === false ? 0 : res;
        } catch (e) { return expr; }
    },

    runCode() {
        if (RAM.textBuffer.length > 0) {
            APU.init();
            RAM.isRunning = true;
            RAM.currentLineIndex = 0;
            RAM.callStack = []; 
            RAM.forStack = [];
            RAM.whileStack = [];
            RAM.switchStack = []; 
            RAM.ifStack = []; // NEW: Tracks IF/ELSE block fulfillment!
            
            let preservedCount = RAM.variables["SYS_FILE_COUNT"];
            let preservedFiles = RAM.variables["SYS_FILES"];
            let preservedEvent = RAM.variables["SYS_GUI_EVENT"]; 
            
            RAM.variables = {}; 
            RAM.varTypes = {}; 
            
            if (preservedCount !== undefined) {
                RAM.variables["SYS_FILE_COUNT"] = preservedCount;
                RAM.variables["SYS_FILES"] = preservedFiles;
            }
            if (preservedEvent !== undefined) RAM.variables["SYS_GUI_EVENT"] = preservedEvent;
            
            RAM.waitingForTimer = RAM.waitingForInput = false;
            RAM.keysDown = {}; RAM.touchActive = 0;
        } 
        else if (RAM.rawBuffer.length > 0) GPU.printLine("?CANNOT RUN RAW TEXT DIRECTLY\nREADY.");
        else GPU.printLine("MEMORY IS EMPTY.\nREADY.");
    },

    // Helper: Enforces Strict Typing on Variables
    _assignVar(name, value, type) {
        let casted;
        if (type === "INT") casted = Math.floor(Number(value)) || 0;
        else if (type === "FLOAT") casted = Number(value) || 0.0;
        else if (type === "BOOL") casted = (value && value !== "0" && value !== 0) ? 1 : 0;
        else if (type === "STRING") casted = String(value).replace(/^"|"$/g, ''); 
        else casted = value; 
        
        RAM.variables[name] = casted;
    },

    // Helper: Fast-forwards the CPU to the next block element
    _skipToNextBranch(startIndex, typesToFind) {
        let depth = 0;
        for (let i = startIndex + 1; i < RAM.textBuffer.length; i++) {
            let upper = RAM.textBuffer[i].code.trim().toUpperCase();
            
            if (upper.startsWith("IF ") || upper.startsWith("SWITCH ")) {
                depth++;
            } else if (upper === "END IF" || upper === "END SWITCH") {
                if (depth === 0 && typesToFind.includes(upper)) return i; 
                if (depth === 0) return i; 
                depth--;
            } else if (depth === 0 && typesToFind.some(t => upper.startsWith(t))) {
                return i;
            }
        }
        return startIndex + 1;
    },

    executeStep() {
        if (!RAM.isRunning || RAM.waitingForKey || RAM.waitingForTimer || RAM.waitingForInput) return;
        if (RAM.currentLineIndex >= RAM.textBuffer.length) {
            RAM.isRunning = false; GPU.printLine("READY."); return;
        }

        let currentLine = RAM.textBuffer[RAM.currentLineIndex];
        let code = currentLine.code.trim();

        // Send to internal parser so IF statements can recursively call commands
        this._executeCommand(code, currentLine.line);
    },

    _executeCommand(code, lineNum) {
        let parts = code.split(" ");
        let cmd = parts[0].toUpperCase();

        if (cmd === "REM" || cmd.startsWith("//")) { RAM.currentLineIndex++; return; }

        // ==========================================
        // 1. STRICT VARIABLE DECLARATIONS
        // ==========================================
        if (["VAR", "INT", "FLOAT", "BOOL", "STRING"].includes(cmd)) {
            let decl = code.substring(cmd.length).trim(); 
            let splitIdx = decl.indexOf("=");
            if (splitIdx === -1) { GPU.printLine(`?MISSING ASSIGNMENT IN ${lineNum}\nREADY.`); RAM.isRunning = false; return; }
            
            let vName = decl.substring(0, splitIdx).trim();
            let valExpr = decl.substring(splitIdx + 1).trim();
            let val = this.evaluateExpression(valExpr);
            
            RAM.varTypes[vName] = cmd;
            this._assignVar(vName, val, cmd);
            RAM.currentLineIndex++; return;
        }

        if (cmd === "ARRAY") {
            let decl = code.substring(5).trim();
            let name = decl.substring(0, decl.indexOf("["));
            let sizeExpr = decl.substring(decl.indexOf("[") + 1, decl.indexOf("]"));
            let size = parseInt(this.evaluateExpression(sizeExpr));
            RAM.variables[name] = new Array(size).fill(0);
            RAM.varTypes[name] = "ARRAY";
            RAM.currentLineIndex++; return;
        }

        // ==========================================
        // 2. UPDATING EXISTING VARIABLES
        // ==========================================
        let isUpdate = Object.keys(RAM.variables).find(k => code.startsWith(k + " ") || code.startsWith(k + "=") || code.startsWith(k + "["));
        
        if (isUpdate) {
            let splitIndex = code.indexOf("=");
            if (splitIndex !== -1) {
                let leftSide = code.substring(0, splitIndex).trim();
                let val = this.evaluateExpression(code.substring(splitIndex + 1).trim());
                
                if (leftSide.includes("[")) { 
                    let arrName = leftSide.substring(0, leftSide.indexOf("["));
                    let idx = parseInt(this.evaluateExpression(leftSide.substring(leftSide.indexOf("[") + 1, leftSide.indexOf("]"))));
                    if (Array.isArray(RAM.variables[arrName])) RAM.variables[arrName][idx] = val;
                } else {
                    this._assignVar(isUpdate, val, RAM.varTypes[isUpdate]);
                }
                RAM.currentLineIndex++; return;
            }
        } 
        // NEW FIX: Ignores '=' if it is inside an ELSE IF, CASE, or WHILE statement
        else if (code.includes("=") && !code.startsWith("IF ") && !code.startsWith("ELSE ") && !code.startsWith("FOR ") && !code.startsWith("WHILE ") && !code.startsWith("CASE ") && !code.includes("GET_KEY")) {
            GPU.printLine(`?UNDECLARED VARIABLE IN ${lineNum}`);
            GPU.printLine("USE VAR, INT, FLOAT, BOOL, OR STRING");
            GPU.printLine("READY."); RAM.isRunning = false; return;
        }

        // ==========================================
        // 3. MULTI-LINE IF / ELSE IF / ELSE
        // ==========================================
        if (cmd === "IF") {
            let hasThen = code.includes(" THEN ");
            let condStr = hasThen ? code.substring(2, code.indexOf(" THEN ")).trim() : code.substring(2).trim();
            let isTrue = (this.evaluateExpression(condStr) > 0);

            if (hasThen) { // Inline IF (No END IF required)
                if (isTrue) {
                    let action = code.substring(code.indexOf(" THEN ") + 6).trim();
                    RAM.textBuffer.splice(RAM.currentLineIndex + 1, 0, { line: -1, code: action });
                }
                RAM.currentLineIndex++; return;
            }

            // Block IF
            RAM.ifStack.push({ satisfied: isTrue });
            if (isTrue) {
                RAM.currentLineIndex++; return;
            } else {
                RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["ELSE IF", "ELSE", "END IF"]);
                return;
            }
        }
        
        if (cmd === "ELSE" && parts[1] === "IF") {
            let top = RAM.ifStack.length - 1;
            
            // If the preceding IF or ELSE IF was already true, skip to the END IF!
            if (top >= 0 && RAM.ifStack[top].satisfied) {
                RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["END IF"]);
                return;
            }

            let condStr = code.substring(7).trim();
            let isTrue = (this.evaluateExpression(condStr) > 0);
            
            if (isTrue) {
                if (top >= 0) RAM.ifStack[top].satisfied = true;
                RAM.currentLineIndex++; return;
            } else {
                RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["ELSE IF", "ELSE", "END IF"]); 
                return;
            }
        }

        if (cmd === "ELSE") { 
            let top = RAM.ifStack.length - 1;
            if (top >= 0 && RAM.ifStack[top].satisfied) {
                RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["END IF"]);
                return;
            }
            if (top >= 0) RAM.ifStack[top].satisfied = true;
            RAM.currentLineIndex++; return; 
        }
        
        if (code === "END IF") { 
            if (RAM.ifStack.length > 0) RAM.ifStack.pop();
            RAM.currentLineIndex++; return; 
        }

        // ==========================================
        // 4. SWITCH / CASE
        // ==========================================
        if (cmd === "SWITCH") {
            let val = this.evaluateExpression(code.substring(6).trim());
            RAM.switchStack.push(val);
            RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["CASE", "DEFAULT", "END SWITCH"]);
            return;
        }

        if (cmd === "CASE") {
            let activeSwitchVal = RAM.switchStack[RAM.switchStack.length - 1];
            let caseVal = this.evaluateExpression(code.substring(4).trim());
            if (activeSwitchVal == caseVal) { RAM.currentLineIndex++; return; } 
            else { RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["CASE", "DEFAULT", "END SWITCH"]); return; } 
        }

        if (cmd === "DEFAULT") { RAM.currentLineIndex++; return; }
        
        if (cmd === "BREAK") { 
            RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["END SWITCH"]); return; 
        }
        
        if (code === "END SWITCH") { RAM.switchStack.pop(); RAM.currentLineIndex++; return; }

        // ==========================================
        // 5. LOOPS (WHILE / FOR)
        // ==========================================
        if (cmd === "WHILE") {
            let condStr = code.substring(5).trim();
            if (this.evaluateExpression(condStr) > 0) {
                RAM.whileStack.push({ lineIndex: RAM.currentLineIndex, cond: condStr });
                RAM.currentLineIndex++; return;
            } else {
                RAM.currentLineIndex = this._skipToNextBranch(RAM.currentLineIndex, ["WEND"]); return;
            }
        }

        if (cmd === "WEND") {
            let loop = RAM.whileStack[RAM.whileStack.length - 1];
            if (this.evaluateExpression(loop.cond) > 0) { RAM.currentLineIndex = loop.lineIndex + 1; return; } 
            else { RAM.whileStack.pop(); RAM.currentLineIndex++; return; }
        }

        if (cmd === "FOR") {
            let expr = code.substring(3).trim(); 
            let p1 = expr.split("=");
            if (p1.length === 2) {
                let p2 = p1[1].split("TO");
                if (p2.length === 2) {
                    let vName = p1[0].trim();
                    if(!RAM.variables[vName]) { RAM.variables[vName] = 0; RAM.varTypes[vName] = "INT"; } 
                    RAM.variables[vName] = parseInt(this.evaluateExpression(p2[0].trim()));
                    RAM.forStack.push({ v: vName, end: p2[1].trim(), returnIndex: RAM.currentLineIndex + 1 });
                    RAM.currentLineIndex++; return;
                }
            }
        }
        
        if (cmd === "NEXT") {
            let vName = parts[1].trim();
            let loopIndex = RAM.forStack.length - 1; 
            if (loopIndex >= 0 && RAM.forStack[loopIndex].v === vName) {
                let loop = RAM.forStack[loopIndex];
                RAM.variables[vName]++;
                if (RAM.variables[vName] <= parseInt(this.evaluateExpression(loop.end))) {
                    RAM.currentLineIndex = loop.returnIndex; return;
                } else {
                    RAM.forStack.pop(); RAM.currentLineIndex++; return;
                }
            }
        }

        // ==========================================
        // 6. I/O & FANTASY CONSOLE BRIDGES
        // ==========================================
        if (code.includes("GET_KEY")) {
            let p = code.split("=");
            if (p.length === 2) { RAM.targetVar = p[0].trim(); RAM.waitingForKey = true; return; }
        }

        if (cmd === "PRINT") {
            let text = code.substring(5).trim();
            if (text.startsWith('"') && text.endsWith('"')) GPU.printLine(text.substring(1, text.length - 1));
            else GPU.printLine(this.evaluateExpression(text)?.toString() || "");
            RAM.currentLineIndex++; return;
        } 
        
        if (cmd === "INPUT") { RAM.waitingForInput = true; RAM.inputVar = parts[1].trim(); RAM.inputBuffer = ""; return; }
        
        if (cmd === "WAIT") {
            let delay = parseInt(this.evaluateExpression(parts[1])) || 100;
            RAM.waitingForTimer = true;
            setTimeout(() => { RAM.waitingForTimer = false; RAM.currentLineIndex++; }, delay); return;
        }

        if (cmd === "GOSUB") {
            let targetIndex = RAM.textBuffer.findIndex(item => item.line === parseInt(parts[1]));
            if (targetIndex !== -1) { RAM.callStack.push(RAM.currentLineIndex + 1); RAM.currentLineIndex = targetIndex; return; }
            GPU.printLine("?LINE NOT FOUND ERROR\nREADY."); RAM.isRunning = false; return;
        }
        
        if (cmd === "RETURN") {
            if (RAM.callStack.length > 0) { RAM.currentLineIndex = RAM.callStack.pop(); return; }
            GPU.printLine("?RETURN WITHOUT GOSUB\nREADY."); RAM.isRunning = false; return;
        }
        
        if (cmd === "GOTO") {
            let targetIndex = RAM.textBuffer.findIndex(item => item.line === parseInt(parts[1]));
            if (targetIndex !== -1) { RAM.currentLineIndex = targetIndex; return; } 
            GPU.printLine(`?LINE NOT FOUND ERROR: ${parts[1]}\nREADY.`); RAM.isRunning = false; return;
        }

        // ==========================================
        // FANTASY CONSOLE COMMANDS
        // ==========================================
        if (cmd === "SPRITE") {
            let sId = parseInt(this.evaluateExpression(parts[1]));
            let sx = parseInt(this.evaluateExpression(parts[2]));
            let sy = parseInt(this.evaluateExpression(parts[3]));
            import('./os_display.js').then(module => { module.GPU.drawSprite(sId, sx, sy); });
            RAM.currentLineIndex++; return;
        }

        if (cmd === "MAP") {
            let mId = parseInt(this.evaluateExpression(parts[1]));
            let mOffsetX = parts[2] ? parseInt(this.evaluateExpression(parts[2])) : 0;
            let mOffsetY = parts[3] ? parseInt(this.evaluateExpression(parts[3])) : 0;
            import('./os_display.js').then(module => { module.GPU.drawMap(mId, mOffsetX, mOffsetY); });
            RAM.currentLineIndex++; return;
        }

        if (cmd === "SFX") { STUDIO.playSfx(parseInt(this.evaluateExpression(parts[1]))); RAM.currentLineIndex++; return; }
        if (cmd === "MUSIC") { STUDIO.playPattern(parseInt(this.evaluateExpression(parts[1]))); RAM.currentLineIndex++; return; }

        if (cmd === "CLEAR_SCR") {
            RAM.vram.forEach(cell => { cell.char = ' '; cell.bg = RAM.systemBgColor; });
            RAM.cursorX = RAM.cursorY = 0; RAM.currentLineIndex++; return;
        }
        if (cmd === "END") { RAM.isRunning = false; GPU.printLine("READY."); return; }

        if (lineNum !== -1) GPU.printLine(`?SYNTAX ERROR IN ${lineNum}\nREADY.`);
        RAM.isRunning = false;
    }
};