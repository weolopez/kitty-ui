// Components module for the Ghostty Graphics Library.
// This module defines the basic visual components that can be used in the scene graph.

import { Node } from "./node.ts";
import { KittyUtil } from "./kitty.ts"; // Assuming KittyUtil is in kitty.ts

// Define types for clarity
type Size = [number, number]; // [width, height]
type Position = [number, number]; // [x, y]
type Color = [number, number, number]; // [r, g, b]

export class Rectangle extends Node {
    size: Size;
    color: Color;
    fill: boolean;

    constructor(
        size: Size,
        color: Color = [255, 255, 255],
        fill: boolean = true,
        position: Position = [0, 0]
    ) {
        super(position);
        this.size = size;
        this.color = color;
        this.fill = fill;
    }

    render(kittyUtil: KittyUtil): void {
        const [x, y] = this.absolutePosition;
        const [width, height] = this.size;
        const [r, g, b] = this.color;

        // Move to the starting position
        kittyUtil.moveCursor(y + 1, x + 1); // +1 because terminal is 1-indexed

        if (this.fill) {
            // Filled rectangle
            for (let row = 0; row < height; row++) {
                kittyUtil.moveCursor(y + row + 1, x + 1);
                kittyUtil.setBackgroundColor(r, g, b);
                // Each character is roughly twice as tall as it is wide,
                // so we use two spaces per character to get a more square-like appearance
                kittyUtil.stdout.writeSync(new TextEncoder().encode(" ".repeat(width * 2)));
                kittyUtil.resetColors();
            }
        } else {
            // Outlined rectangle
            kittyUtil.setForegroundColor(r, g, b);

            // Top border
            kittyUtil.moveCursor(y + 1, x + 1);
            kittyUtil.stdout.writeSync(new TextEncoder().encode("+" + "-".repeat(width * 2 - 2) + "+"));

            // Side borders
            for (let row = 1; row < height - 1; row++) {
                kittyUtil.moveCursor(y + row + 1, x + 1);
                kittyUtil.stdout.writeSync(new TextEncoder().encode("|" + " ".repeat(width * 2 - 2) + "|"));
            }

            // Bottom border
            kittyUtil.moveCursor(y + height, x + 1);
            kittyUtil.stdout.writeSync(new TextEncoder().encode("+" + "-".repeat(width * 2 - 2) + "+"));

            kittyUtil.resetColors();
        }
    }
}

export class Text extends Node {
    text: string;
    color: Color;

    constructor(
        text: string,
        color: Color = [255, 255, 255],
        position: Position = [0, 0]
    ) {
        super(position);
        this.text = text;
        this.color = color;
    }

    render(kittyUtil: KittyUtil): void {
        const [x, y] = this.absolutePosition;
        const [r, g, b] = this.color;

        // Move to the position
        kittyUtil.moveCursor(y + 1, x + 1); // +1 because terminal is 1-indexed

        // Set the color and write the text
        kittyUtil.setForegroundColor(r, g, b);
        kittyUtil.stdout.writeSync(new TextEncoder().encode(this.text));
        kittyUtil.resetColors();
    }
}

export class Image extends Node {
    imageSource: string | Uint8Array | any; // TODO: Define a proper type for Deno Image
    size: Size | undefined;

    constructor(
        imageSource: string | Uint8Array | any, // TODO: Define a proper type for Deno Image
        size: Size | undefined = undefined,
        position: Position = [0, 0]
    ) {
        super(position);
        this.imageSource = imageSource;
        this.size = size;
    }

    async render(kittyUtil: KittyUtil): Promise<void> {
        const [x, y] = this.absolutePosition;

        // If size is provided, unpack it
        let width: number | undefined = undefined;
        let height: number | undefined = undefined;
        if (this.size) {
            [width, height] = this.size;
        }

        // Display the image at the calculated position
        await kittyUtil.displayImage(
            this.imageSource,
            width,
            height,
            [x, y] // Position in characters, need to convert to pixels if Kitty protocol uses pixels
            // NOTE: The Python code used character positions for the Image node, but the Kitty protocol
            // display_image function in the Python code used pixel positions. This needs clarification
            // or adjustment based on how the Deno KittyUtil handles positioning. Assuming character
            // positions for now, but this might need revisiting.
        );
    }
}

export class Group extends Node {
    constructor(position: Position = [0, 0]) {
        super(position);
    }

    render(kittyUtil: KittyUtil): void {
        // Group doesn't render anything itself, it just contains other components
    }
}