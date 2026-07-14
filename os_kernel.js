const Kernel = {
    // ==========================================
    // 1. KERNEL STATE & FILE SYSTEM INIT
    // ==========================================
    
    // The current active directory. All virtual saves/loads happen inside this "folder".
    // Using a prefix system lets us fake a real folder structure in a flat database.
    activeDir: "MASTER.diskDIR",

    // ==========================================
    // 2. VIRTUAL FILE SYSTEM (LOCAL STORAGE)
    // ==========================================
    
    // Saves a file to the browser's persistent localStorage cache.
    // It prepends the active directory name (e.g., "MASTER.diskDIR/COLORS.diskGUI")
    virtualSave: function(filename, payload) {
        let key = this.activeDir + "/" + filename;
        try {
            localStorage.setItem(key, payload);
        } catch (e) {
            console.error("Virtual Drive Full or Disabled", e);
            if (typeof Parser !== 'undefined') {
                Parser.printLine("?VIRTUAL DRIVE ERROR (QUOTA EXCEEDED)");
            }
        }
    },

    // Loads a file strictly from the currently mounted directory
    virtualLoad: function(filename) {
        let key = this.activeDir + "/" + filename;
        return localStorage.getItem(key);
    },

    // Scans localStorage for all files that belong to a specific directory prefix
    mountDir: function(dirname) {
        this.activeDir = dirname;
        let files = [];
        let prefix = this.activeDir + "/";
        
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            // If the key starts with our folder name, chop off the folder name and list the file
            if (key.startsWith(prefix)) {
                files.push(key.substring(prefix.length));
            }
        }
        return files;
    },

    // ==========================================
    // 3. PHYSICAL HARDWARE I/O (DEVICE STORAGE)
    // ==========================================
    
    // Packages data into a binary blob and forces the browser to download it.
    // This is how you export native P1 Creations apps to your phone's real storage.
    physicalExport: function(filename, payload) {
        // CRITICAL FIX: Using 'application/octet-stream' tells the mobile browser that this is 
        // a raw binary file. This forces the browser to respect our proprietary .disk 
        // extensions instead of automatically appending ".txt" to the end of the filename!
        const blob = new Blob([payload], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup the DOM and memory after the download triggers
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    },

    // Spawns a hidden HTML file input to browse the phone/computer for a physical file
    triggerImport: function() {
        const input = document.createElement('input');
        input.type = 'file';
        // Suggest file types to the OS file picker
        input.accept = '.diskCODE,.diskGUI,.diskPAD,.txt'; 
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) {
                if (typeof Parser !== 'undefined') {
                    Parser.printLine("?IMPORT CANCELLED");
                    Parser.printLine("READY.");
                }
                return;
            }
            
            const reader = new FileReader();
            reader.onload = event => {
                // Send the contents of the chosen file to the Kernel's import processor
                this.processImport(event.target.result, file.name);
            };
            reader.readAsText(file);
        };
        
        input.click();
    },

    // Handles files dropped onto the screen or selected via triggerImport
    processImport: function(content, filename) {
        // 1. Immediately save a copy of it to the Virtual Drive so it persists after a reboot
        this.virtualSave(filename, content);
        
        if (typeof Parser !== 'undefined') {
            Parser.printLine("IMPORTED " + filename + " TO DISK.");
            // 2. Pass the data to the Parser to be compiled into the active system memory
            Parser.processFileContent(content, filename);
        }
    }
};
