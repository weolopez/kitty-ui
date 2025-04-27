// Kitty Protocol Utility for the Ghostty Graphics Library.
// This module provides utilities for generating Kitty graphics protocol escape sequences.

import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { ensureFile } from "https://deno.land/std@0.224.0/fs/ensure_file.ts";
/* import { Image } from "https://deno.land/x/images@1.3.0/mod.ts"; // Using deno.land/x/images as a PIL alternative */

export class KittyUtil {
    // Changed to public to allow components to write directly
    // Using Deno.WriterSync as writeSync is used
    public stdout: { writeSync(p: Uint8Array): number };

    constructor(stdout: { writeSync(p: Uint8Array): number } = Deno.stdout) {
        this.stdout = stdout;
    }

    clearScreen(): void {
        this.stdout.writeSync(new TextEncoder().encode("\x1b[2J\x1b[H"));
    }

    moveCursor(row: number, col: number): void {
        this.stdout.writeSync(new TextEncoder().encode(`\x1b[${row};${col}H`));
    }

    setForegroundColor(r: number, g: number, b: number): void {
        this.stdout.writeSync(new TextEncoder().encode(`\x1b[38;2;${r};${g};${b}m`));
    }

    setBackgroundColor(r: number, g: number, b: number): void {
        this.stdout.writeSync(new TextEncoder().encode(`\x1b[48;2;${r};${g};${b}m`));
    }

    resetColors(): void {
        this.stdout.writeSync(new TextEncoder().encode("\x1b[0m"));
    }

    formatImageCode(
        imageDataBase64: string,
        width: number,
        height: number,
        position?: [number, number]
    ): string {
        // Base parameters
        const params = [
            "f=100",  // Format: PNG
            `s=${width}`,  // Width
            `v=${height}`,  // Height
            "a=T",  // Transmit data
            "t=d",  // Direct (base64 encoded)
            "m=0"   // No more data follows
        ];

        // Add position parameters if provided
        if (position) {
            const [x, y] = position;
            params.push(`x=${x}`);
            params.push(`y=${y}`);
        }

        // Construct the escape sequence
        return `\x1b_G${params.join(',')};${imageDataBase64}\x1b\\`;
    }

    async displayImage(
        imageSource: string | Uint8Array | Image, // Deno's Image class or bytes
        width?: number,
        height?: number,
        position?: [number, number]
    ): Promise<void> {
        let image: Image;

        if (typeof imageSource === 'string') {
            // Assume it's a file path
            const fileContent = await Deno.readFile(imageSource);
            image = await Image.decode(fileContent);
        } else if (imageSource instanceof Uint8Array) {
            // Raw image bytes
            image = await Image.decode(imageSource);
        } else if (imageSource instanceof Image) {
            // Deno Image object
            image = imageSource;
        } else {
            throw new Error(`Unsupported image source type: ${typeof imageSource}`);
        }

        // Resize if needed
        let finalWidth = width ?? image.width;
        let finalHeight = height ?? image.height;

        if (width !== undefined || height !== undefined) {
             // Calculate the new dimensions while preserving aspect ratio
             const origWidth = image.width;
             const origHeight = image.height;
             if (width === undefined) {
                 finalWidth = Math.floor(origWidth * (height! / origHeight));
             } else if (height === undefined) {
                 finalHeight = Math.floor(origHeight * (width / origWidth));
             }

             image = image.resize(finalWidth, finalHeight);
        }


        // Convert to PNG and encode as base64
        const pngBytes = await image.encode(Image.Format.PNG);
        const imageDataBase64 = encodeBase64(pngBytes); // Use encodeBase64

        // Generate and write the escape sequence
        const escapeSequence = this.formatImageCode(imageDataBase64, finalWidth, finalHeight, position);
        this.stdout.writeSync(new TextEncoder().encode(escapeSequence));
    }

    flush(): void {
        // Deno.stdout is automatically flushed
    }
}