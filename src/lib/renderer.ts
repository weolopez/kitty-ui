// Renderer module for the Ghostty Graphics Library.
// This module defines the Renderer class, which is responsible for traversing
// the scene graph and rendering all components.

import { Node } from "./node.ts";
import { KittyUtil } from "./kitty.ts";

export class Renderer {
    private rootNode: Node;
    private kittyUtil: KittyUtil;

    constructor(rootNode: Node, kittyUtil: KittyUtil | undefined = undefined) {
        this.rootNode = rootNode;
        this.kittyUtil = kittyUtil || new KittyUtil();
    }

    renderScene(): void {
        // Clear the screen
        this.kittyUtil.clearScreen();

        // Update transforms starting from the root
        this.rootNode.updateTransform();

        // Render the scene graph
        this._renderNode(this.rootNode);

        // Flush the output
        this.kittyUtil.flush();
    }

    private _renderNode(node: Node): void {
        // Render the node itself
        node.render(this.kittyUtil);

        // Render all children
        for (const child of node.children) {
            this._renderNode(child);
        }
    }
}