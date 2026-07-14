# 💾 DiskOS V1.5

**A lightweight, 8-bit fantasy console and desktop environment built entirely in vanilla JavaScript, HTML, and CSS.**

DiskOS is a love letter to vintage computing and terminal environments. It provides a complete, sandboxed 64x32 virtual machine running right in your browser. With version 1.5, DiskOS evolves from a simple game engine into a full Operating System, featuring a Virtual File System, mountable project directories, and a declarative, text-driven GUI framework.

## ✨ Key Features

* **Virtual File System (VFS):** Save files instantly to persistent local storage without triggering browser download popups.
* **Mountable Workspaces (`.diskDIR`):** Organize your projects into virtual floppy disks. Mount a directory, and the OS handles routing your saves and generating file lists automatically.
* **Auto-Booting:** Drop a `MAIN.diskCODE` file into any directory, and DiskOS will automatically execute it upon mounting.
* **Declarative UI Engine (`.diskGUI`):** Build custom top-bar menus (like `$TOOLS CALCULATOR`) simply by writing a text configuration file. DiskOS handles the routing and triggers events in your code.
* **Custom `diskCODE` Language:** A fast, easy-to-learn BASIC-inspired language featuring variables, arrays, logic loops, and hardware polling.
* **Built-in Sprite & Audio Engines:** Define 1-bit sprites via string data, and generate raw square waves and musical notes on a dedicated Web Audio thread.

## 🚀 Quick Start

DiskOS requires zero dependencies, build steps, or servers.

1. Clone this repository and open `index.html` in your browser.
2. At the `READY.` prompt, type `HELP` for a list of system commands.
3. Type `$FILE` to open the built-in system menu.

### Create Your First Project
```text
1. MOUNT "HELLO.diskDIR"
2. 10 PRINT "HELLO WORLD"
3. SAVE "MAIN.diskCODE"
4. MOUNT "HELLO.diskDIR" (Watch it auto-boot!)
