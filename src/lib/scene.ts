// Scene module for the Ghostty Graphics Library.
// This module defines the Scene class, which is a high-level container for the entire scene.
// It handles terminal dimensions and provides options for full-screen or windowed mode.

import { Node } from "./node.ts";
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
    private focusableComponents: FocusableComponent[]; // List of focusable components
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
        this.focusableComponents = []; // Initialize the list

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
        this.addChild(this.background); // Use the overridden addChild

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

    // Override addChild to manage focusable components
    override addChild(child: Node): Node {
        super.addChild(child);
        // Check if the added child is focusable and add it to the list
        if ('isFocused' in child && typeof (child as any).onFocus === 'function') {
            this.focusableComponents.push(child as unknown as FocusableComponent);
            this.sortFocusableComponents();
            // If no component is focused, set focus to the first one
            if (this.focusedComponent === null) {
                this.setFocus(this.focusableComponents[0]);
            }
        }
        return child;
    }

    // Override removeChild to manage focusable components
    override removeChild(child: Node): boolean {
        const wasFocused = this.focusedComponent !== null && this.focusedComponent instanceof Node && this.focusedComponent === child;
        const removed = super.removeChild(child);

        if (removed) {
            // Remove from focusable components list
            // Ensure child is treated as FocusableComponent for indexOf comparison
            const index = this.focusableComponents.indexOf(child as unknown as FocusableComponent);
            if (index > -1) {
                this.focusableComponents.splice(index, 1);
                this.sortFocusableComponents();
            }

            // If the removed component was focused, set focus to the next available component
            if (wasFocused) {
                this.setFocus(this.focusableComponents.length > 0 ? this.focusableComponents[0] : null);
            }
        }
        return removed;
    }

    private sortFocusableComponents(): void {
        this.focusableComponents.sort((a, b) => {
            const aIndex = a.tabIndex === undefined ? Infinity : a.tabIndex;
            const bIndex = b.tabIndex === undefined ? Infinity : b.tabIndex;
            return aIndex - bIndex;
        });
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

        // If the focused component didn't handle it, handle tab and arrow keys for navigation
        if (key === 'tab' || key === 'shift_tab') {
            const tabbable = this.getTabbableChildren();
            if (tabbable.length > 0) {
                let currentIndex = this.focusedComponent ? tabbable.indexOf(this.focusedComponent) : -1;
                let nextIndex = -1;

                if (key === 'tab') {
                    nextIndex = (currentIndex + 1) % tabbable.length;
                } else { // shift_tab
                    nextIndex = (currentIndex - 1 + tabbable.length) % tabbable.length;
                }

                this.setFocus(tabbable[nextIndex]);
                return true;
            }
        } else if (key === 'up' || key === 'down' || key === 'left' || key === 'right') {
            // Basic arrow key navigation (can be overridden by components)
            const tabbable = this.getTabbableChildren();
            if (this.focusedComponent && this.focusedComponent instanceof Node) {
                const currentPos = (this.focusedComponent as Node).absolutePosition;
                let nearestComponent: FocusableComponent | null = null;
                let minDistance = Infinity;

                for (const component of tabbable) {
                    if (component !== this.focusedComponent && component instanceof Node) {
                        const componentPos = (component as Node).absolutePosition;
                        let isCandidate = false;
                        let distance = Infinity;

                        if (key === 'up' && componentPos[1] < currentPos[1]) {
                            isCandidate = true;
                            distance = currentPos[1] - componentPos[1] + Math.abs(currentPos[0] - componentPos[0]);
                        } else if (key === 'down' && componentPos[1] > currentPos[1]) {
                            isCandidate = true;
                            distance = componentPos[1] - currentPos[1] + Math.abs(currentPos[0] - componentPos[0]);
                        } else if (key === 'left' && componentPos[0] < currentPos[0]) {
                            isCandidate = true;
                            distance = currentPos[0] - componentPos[0] + Math.abs(currentPos[1] - componentPos[1]);
                        } else if (key === 'right' && componentPos[0] > currentPos[0]) {
                            isCandidate = true;
                            distance = componentPos[0] - currentPos[0] + Math.abs(currentPos[1] - componentPos[1]);
                        }

                        if (isCandidate && distance < minDistance) {
                            minDistance = distance;
                            nearestComponent = component;
                        }
                    }
                }

                if (nearestComponent) {
                    this.setFocus(nearestComponent);
                    return true;
                }
            }
        }

        // If not handled by focused component, tab, or arrow keys, try the scene's handlers
        if (key in this.keyboardHandlers) {
            this.keyboardHandlers[key](key); // Pass the key to the handler
            return true;
        }

        return false;
    }
}