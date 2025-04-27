// Scene module for the Ghostty Graphics Library.
// This module defines the Scene class, which is a high-level container for the entire scene.
// It handles terminal dimensions and provides options for full-screen or windowed mode.

import { Group, Rectangle } from "./components.ts"; // Assuming Group and Rectangle are in components.ts
import { Renderer } from "./renderer.ts"; // Assuming Renderer is in renderer.ts
import { KittyUtil } from "./kitty.ts"; // Assuming KittyUtil is in kitty.ts
import { FocusableComponent } from "./input_components.ts"; // Assuming FocusableComponent is in input_components.ts

// Define types for clarity
type Size = [number, number]; // [width, height]
type Position = [number, number]; // [x, y]
type Color = [number, number, number]; // [r, g, b]
type KeyboardHandler = (key: string) => void;

export class Scene extends Group {
    size: Size;
    fullScreen: boolean;
    backgroundColor: Color;
    focusedComponent: FocusableComponent | null;
    private keyboardHandlers: { [key: string]: KeyboardHandler };
    renderer: Renderer;
    background: Rectangle; // Declare background property

    constructor(
        size: Size | undefined = undefined,
        position: Position = [0, 0],
        fullScreen: boolean = true,
        backgroundColor: Color = [0, 0, 0]
    ) {
        super(position);

        this.fullScreen = fullScreen;
        this.backgroundColor = backgroundColor;
        this.focusedComponent = null;
        this.keyboardHandlers = {};

        // Get terminal size if full screen or size is not provided
        if (fullScreen || size === undefined) {
            this.size = this.getTerminalSize();
        } else {
            this.size = size;
        }

        // Create a background rectangle
        this.background = new Rectangle(
            this.size,
            backgroundColor,
            true,
            [0, 0]
        );
        this.addChild(this.background);

        // Create a renderer
        this.renderer = new Renderer(this);
    }

    private getTerminalSize(): Size {
        try {
            const { columns, rows } = Deno.consoleSize();
            return [columns, rows];
        } catch (e) {
            console.error("Failed to get terminal size:", e);
            // Default size if unable to determine
            return [80, 24];
        }
    }

    // The Scene itself doesn't render anything directly
    // Its children (including the background) will be rendered by the renderer
    override render(kittyUtil: KittyUtil): void { // Added override modifier
        // This method is required by the Node base class but is a no-op for Scene
    }

    renderScene(): void {
        // This is a convenience method that calls the renderer's renderScene method.
        this.renderer.renderScene();
    }

    setFocus(component: FocusableComponent | null): void {
        // Remove focus from the currently focused component
        if (this.focusedComponent && typeof this.focusedComponent.onBlur === 'function') {
            this.focusedComponent.onBlur();
        }

        // Set focus to the new component
        this.focusedComponent = component;
        if (component && typeof component.onFocus === 'function') {
            component.onFocus();
        }
    }

    registerKeyboardHandler(key: string, handler: KeyboardHandler): void {
        this.keyboardHandlers[key] = handler;
    }

    handleKey(key: string): boolean {
        // First, try to let the focused component handle the key
        if (this.focusedComponent && typeof this.focusedComponent.handleKey === 'function') {
            if (this.focusedComponent.handleKey(key)) {
                return true;
            }
        }

        // If the focused component didn't handle it, try the scene's handlers
        if (key in this.keyboardHandlers) {
            this.keyboardHandlers[key](key); // Pass the key to the handler
            return true;
        }

        return false;
    }
}