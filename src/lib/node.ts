// Node module for the Ghostty Graphics Library.
// This module defines the Node class, which is the foundation of the scene graph.

import { FocusableComponent } from "./input_components.ts";

export abstract class Node {
    position: [number, number];
    absolutePosition: [number, number]; // Will be recalculated during updateTransform
    parent: Node | null;
    children: Node[];
    visible: boolean; // Added visible property

    constructor(position: [number, number] = [0, 0]) {
        this.position = position;
        this.absolutePosition = position; // Initial value, will be updated
        this.parent = null;
        this.children = [];
        this.visible = true; // Nodes are visible by default
    }

    addChild(child: Node): Node {
        if (child.parent) {
            child.parent.removeChild(child);
        }

        child.parent = this;
        this.children.push(child);
        return child;
    }

    removeChild(child: Node): boolean {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
            return true;
        }
        return false;
    }

    updateTransform(force: boolean = false): void {
        // Calculate absolute position based on parent (if any)
        if (this.parent) {
            const [parentX, parentY] = this.parent.absolutePosition;
            const [relX, relY] = this.position;
            this.absolutePosition = [parentX + relX, parentY + relY];
        } else {
            // Root node's absolute position is the same as its relative position
            this.absolutePosition = this.position;
        }

        // Recursively update all children
        for (const child of this.children) {
            child.updateTransform(force);
        }
    }

    // Method to find focusable children recursively
    getTabbableChildren(): FocusableComponent[] {
        // Base implementation returns an empty array
        return [];
    }

    abstract render(kittyUtil: any): void; // TODO: Define KittyUtil type
}