// Kitty Protocol Utility for the Ghostty Graphics Library.
// This module provides utilities for generating Kitty graphics protocol escape sequences.

import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { ensureFile } from "jsr:@std/fs@1/ensure-file";
// import { Image, decode } from "jsr:images"; // Using deno.land/x/images as a PIL alternative - Temporarily commented out due to module not found error

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
        imageSource: string | Uint8Array | any, // Deno's Image class or bytes // Temporarily changed type
        width?: number,
        height?: number,
        position?: [number, number]
    ): Promise<void> {
        // let image: Image; // Temporarily commented out due to module not found error

        if (typeof imageSource === 'string') {
            // Assume it's a file path
            // const fileContent = await Deno.readFile(imageSource); // Commented out
            // image = await decode(fileContent); // Commented out
        } else if (imageSource instanceof Uint8Array) {
            // Raw image bytes
            // image = await decode(imageSource); // Commented out
        } else {
            // Temporarily skip image processing if module is not found
            console.error("Image module not available, skipping image display.");
            return;
            // throw new Error(`Unsupported image source type: ${typeof imageSource}`);
        }

        // Temporarily commented out image processing due to module not found error
        // // Resize if needed
        // let finalWidth = width ?? image.width;
        // let finalHeight = height ?? image.height;

        // if (width !== undefined || height !== undefined) {
        //      // Calculate the new dimensions while preserving aspect ratio
        //      const origWidth = image.width;
        //      const origHeight = image.height;
        //      if (width === undefined) {
        //          finalWidth = Math.floor(origWidth * (height! / origHeight));
        //      } else if (height === undefined) {
        //          finalHeight = Math.floor(origHeight * (width / origWidth));
        //      }

        //      image = image.resize(finalWidth, finalHeight);
        // }


        // // Convert to PNG and encode as base64
        // const pngBytes = await image.encode(Image.Format.PNG);
        const imageDataBase64 = encodeBase64(new Uint8Array()); // Use encodeBase64 with empty data for now
        let finalWidth = width ?? 0; // Dummy data
        let finalHeight = height ?? 0; // Dummy data

        // Generate and write the escape sequence
        const escapeSequence = this.formatImageCode(imageDataBase64, finalWidth, finalHeight, position);
        this.stdout.writeSync(new TextEncoder().encode(escapeSequence));
    }

    flush(): void {
        // Deno.stdout is automatically flushed
    }
}