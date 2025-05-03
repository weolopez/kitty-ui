// Input Handler module for the Ghostty Graphics Library.
// This module provides functionality for capturing and processing keyboard input
// from the terminal.

// Note: Deno's standard library provides `Deno.stdin` for reading input.
// Handling raw terminal input and escape sequences like the Python
// `termios` and `tty` modules is done using `Deno.stdin.setRaw` and
// reading from the readable stream.

import { Node } from "./node.ts"; // Assuming Node is in node.ts

// Define types for clarity
type KeyHandler = (key: string) => void;

// Key mapping for special keys (basic example, may need expansion)
const KEY_MAPPING: { [key: string]: string } = {
    "\x1b[A": "up",
    "\x1b[B": "down",
    "\x1b[C": "right",
    "\x1b[D": "left",
    "\x1b[H": "home",
    "\x1b[F": "end",
    "\x1b[3~": "delete",
    "\x1b[5~": "page_up",
    "\x1b[6~": "page_down",
    "\x1b": "escape",
    "\r": "enter",
    "\n": "enter",
    "\t": "tab",
    " ": "space",
    "\x7f": "backspace", // ASCII for backspace
    "\x1b[Z": "shift_tab"
};

export class KeyboardInputHandler {
    // Made public to be accessible by InputManager
    public scene: any; // TODO: Define Scene type
    private running: boolean;
    private inputLoopPromise: Promise<void> | null;
    // Store the options used to set raw mode for restoring
    private originalRawOptions: Deno.SetRawOptions | undefined = undefined;

    constructor(scene: any = null) { // TODO: Define Scene type
        this.scene = scene;
        this.running = false;
        this.inputLoopPromise = null;
    }

    async start(): Promise<void> {
        if (this.running) {
            return;
        }

        this.running = true;

        // Attempt to set raw mode (requires --allow-read and --allow-write)
        try {
            // Store the options used when setting raw mode
            // Removed 'echo: false' as it's not in SetRawOptions
            this.originalRawOptions = { cbreak: true };
            Deno.stdin.setRaw(true, this.originalRawOptions);
        } catch (e) {
            console.error("Failed to set raw terminal mode:", e);
            console.error("Input handling may not work as expected. Consider running with --allow-read --allow-write");
            // Continue without raw mode, input might be buffered
            this.originalRawOptions = undefined; // Ensure it's undefined if setting failed
        }

        this.inputLoopPromise = this._inputLoop();
    }

    async stop(): Promise<void> {
        this.running = false;
        // Restore terminal settings
        if (this.originalRawOptions) {
            try {
                // Pass the stored options when setting raw mode to false
                Deno.stdin.setRaw(false, this.originalRawOptions);
            } catch (e) {
                console.error("Failed to restore terminal mode:", e);
            }
        }
        if (this.inputLoopPromise) {
            // Wait for the input loop to finish
            await this.inputLoopPromise;
            this.inputLoopPromise = null;
        }
    }

    private async _inputLoop(): Promise<void> {
        const decoder = new TextDecoder();
        const reader = Deno.stdin.readable.getReader();

        try {
            while (this.running) {
                // Read from the readable stream
                const { value, done } = await reader.read();

                if (done) {
                    // Stream closed
                    break;
                }

                if (value) {
                    const input = decoder.decode(value);
                    this._handleInput(input);
                }
            }
        } catch (e) {
            console.error("Input handler error:", e);
        } finally {
             // Release the reader and restore terminal settings is handled in stop()
             reader.releaseLock();
        }
    }

    private _handleInput(input: string): void {
        // Basic handling of input characters and potential escape sequences
        // This is a simplified version of the Python logic.
        // A full implementation would need to parse escape sequences more carefully.

        let currentInput = input;
        while (currentInput.length > 0) {
            let handled = false;
            for (const seq in KEY_MAPPING) {
                if (currentInput.startsWith(seq)) {
                    this._handleKey(KEY_MAPPING[seq]);
                    currentInput = currentInput.substring(seq.length);
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                // If not a special key, treat as a regular character
                this._handleKey(currentInput[0]);
                currentInput = currentInput.substring(1);
            }
        }
    }


    private _handleKey(key: string): void {
        // console.log(`Key pressed: ${key}`); // For debugging
        if (this.scene) {
            // Let the scene handle the key
            // Assuming the scene has a handleKey method that returns a boolean
            this.scene.handleKey(key);
        }
    }
}

export class InputManager {
    private scene: any; // TODO: Define Scene type
    private keyboardHandler: KeyboardInputHandler;
    private globalHandlers: { [key: string]: KeyHandler[] };

    constructor(scene: any = null) { // TODO: Define Scene type
        this.scene = scene;
        this.keyboardHandler = new KeyboardInputHandler(scene);
        this.globalHandlers = {};
    }

    setScene(scene: any): void { // TODO: Define Scene type
        this.scene = scene;
        // Access the public scene property
        this.keyboardHandler.scene = scene;
    }

    async start(): Promise<void> {
        await this.keyboardHandler.start();
    }

    async stop(): Promise<void> {
        await this.keyboardHandler.stop();
    }

    registerGlobalHandler(key: string, handler: KeyHandler): void {
        if (!this.globalHandlers[key]) {
            this.globalHandlers[key] = [];
        }
        this.globalHandlers[key].push(handler);
    }

    unregisterGlobalHandler(key: string, handler: KeyHandler): void {
        if (this.globalHandlers[key]) {
            const index = this.globalHandlers[key].indexOf(handler);
            if (index > -1) {
                this.globalHandlers[key].splice(index, 1);
            }
        }
    }

    // Method for the KeyboardInputHandler to call
    handleKey(key: string): boolean {
        // Check global handlers first
        if (this.globalHandlers[key]) {
            for (const handler of this.globalHandlers[key]) {
                handler(key);
                // Assuming global handlers don't stop propagation for now
            }
        }

        // Then let the scene handle the key
        if (this.scene) {
            // Assuming the scene has a handleKey method that returns a boolean
            return this.scene.handleKey(key);
        }

        return false;
    }
/**
     * Simulates a key press with a processed key string.
     * This bypasses the raw terminal input handling and directly
     * dispatches the key to global handlers and the scene.
     * @param key The processed key string (e.g., "up", "enter", "a").
     */
    simulateKeyPress(key: string): void {
        this.handleKey(key);
    }
}