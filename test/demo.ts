// Comprehensive demo of the Ghostty Graphics Library.
// This script demonstrates a more complex scene with various components
// arranged in a UI-like layout.

import { Node } from "../src/lib/node.ts";
import { Rectangle, Text, Image, Group } from "../src/lib/components.ts";
import { Renderer } from "../src/lib/renderer.ts";
import { KittyUtil } from "../src/lib/kitty.ts";
import { InputManager } from "../src/lib/input_handler.ts"; // Assuming InputManager is needed for interaction

// Define types for clarity
type Size = [number, number]; // [width, height]
type Position = [number, number]; // [x, y]
type Color = [number, number, number]; // [r, g, b]

// Helper function to get terminal size (already in Scene, but useful here too)
function getTerminalSize(): Size {
    try {
        const { columns, rows } = Deno.consoleSize();
        return [columns, rows];
    } catch (e) {
        console.error("Failed to get terminal size:", e);
        // Default size if unable to determine
        return [80, 24];
    }
}

function createDemoScene(): Group {
    // Create a root group
    const root = new Group();

    // Get terminal size for full screen background
    const terminalSize = getTerminalSize();

    // Add a dark blue background
    const background = new Rectangle(
        terminalSize,
        [0, 0, 40],
        true,
        [0, 0]
    );
    root.addChild(background);

    // Create a header
    const header = new Group([0, 0]);
    root.addChild(header);

    // Header background
    const headerBg = new Rectangle(
        [terminalSize[0], 3],
        [60, 60, 100],
        true,
        [0, 0]
    );
    header.addChild(headerBg);

    // Header title
    const title = new Text(
        "Ghostty Graphics Library Demo",
        [255, 255, 255],
        [25, 1]
    );
    header.addChild(title);

    // Create a sidebar
    const sidebar = new Group([0, 3]);
    root.addChild(sidebar);

    // Sidebar background
    const sidebarBg = new Rectangle(
        [20, terminalSize[1] - 3], // Adjust height based on terminal size
        [40, 40, 80],
        true,
        [0, 0]
    );
    sidebar.addChild(sidebarBg);

    // Sidebar title
    const sidebarTitle = new Text(
        "Components",
        [200, 200, 255],
        [5, 1]
    );
    sidebar.addChild(sidebarTitle);

    // Sidebar menu items
    const menuItems = [
        "Rectangle",
        "Text",
        "Image",
        "Group",
        "Scene Graph"
    ];

    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        const menuItem = new Text(
            `• ${item}`,
            [180, 180, 220],
            [2, 3 + i * 2]
        );
        sidebar.addChild(menuItem);
    }

    // Create a main content area
    const content = new Group([20, 3]);
    root.addChild(content);

    // Content background
    const contentBg = new Rectangle(
        [terminalSize[0] - 20, terminalSize[1] - 3], // Adjust size based on terminal size
        [20, 20, 60],
        true,
        [0, 0]
    );
    content.addChild(contentBg);

    // Content title
    const contentTitle = new Text(
        "Scene Graph Demonstration",
        [220, 220, 255],
        [15, 1]
    );
    content.addChild(contentTitle);

    // Add some sample components to showcase
    // 1. A filled rectangle
    const rect1 = new Rectangle(
        [10, 5],
        [200, 50, 50],
        true,
        [5, 4]
    );
    content.addChild(rect1);

    // Label for rectangle
    const rect1Label = new Text(
        "Filled Rectangle",
        [255, 255, 255],
        [5, 10]
    );
    content.addChild(rect1Label);

    // 2. An outlined rectangle
    const rect2 = new Rectangle(
        [10, 5],
        [50, 200, 50],
        false,
        [25, 4]
    );
    content.addChild(rect2);

    // Label for outlined rectangle
    const rect2Label = new Text(
        "Outlined Rectangle",
        [255, 255, 255],
        [23, 10]
    );
    content.addChild(rect2Label);

    // 3. Nested components demonstration
    const nestedGroup = new Group([45, 4]);
    content.addChild(nestedGroup);

    // Parent rectangle
    const parentRect = new Rectangle(
        [10, 5],
        [50, 50, 200],
        true,
        [0, 0]
    );
    nestedGroup.addChild(parentRect);

    // Child rectangle (positioned relative to parent)
    const childRect = new Rectangle(
        [4, 2],
        [200, 200, 50],
        true,
        [3, 1]
    );
    parentRect.addChild(childRect);

    // Label for nested components
    const nestedLabel = new Text(
        "Nested Components",
        [255, 255, 255],
        [43, 10]
    );
    content.addChild(nestedLabel);

    // Add a footer
    const footer = new Group([0, terminalSize[1] - 3]); // Position at the bottom
    root.addChild(footer);

    // Footer background
    const footerBg = new Rectangle(
        [terminalSize[0], 3],
        [60, 60, 100],
        true,
        [0, 0]
    );
    footer.addChild(footerBg);

    // Footer text
    const footerText = new Text(
        "Press Enter to exit",
        [200, 200, 255],
        [30, 1]
    );
    footer.addChild(footerText);

    // Try to load and display an image if available
    // Note: Deno requires explicit permissions (--allow-read) to read files.
    // The path needs to be relative to the execution directory or absolute.
    // Assuming the image is in the root of the ghostty-graphics-lib project.
    const imagePath = "../../1.png"; // Adjust path as needed

    // Check if the file exists before attempting to create the Image component
    try {
        Deno.statSync(imagePath); // Check if file exists synchronously
        const imgGroup = new Group([5, 13]);
        content.addChild(imgGroup);

        // Image background
        const imgBg = new Rectangle(
            [50, 6],
            [30, 30, 70],
            true,
            [0, 0]
        );
        imgGroup.addChild(imgBg);

        // Image
        // Note: The Python code used pixel size for the image, but character position.
        // The Deno Image component needs to handle this conversion or the KittyUtil
        // displayImage method needs to accept character positions and convert.
        // Assuming the Deno Image component/KittyUtil handles character positions for now.
        const img = new Image(
            imagePath,
            [48, 48], // Size in pixels as per Python example, might need adjustment
            [1, 1] // Position relative to imgGroup in characters
        );
        imgGroup.addChild(img);

        // Image label
        const imgLabel = new Text(
            "Image Component",
            [255, 255, 255],
            [18, 4]
        );
        imgGroup.addChild(imgLabel);

    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.warn(`Image file not found at ${imagePath}. Skipping image component.`);
        } else {
            console.error(`Error checking or loading image file ${imagePath}:`, error);
        }
    }


    return root;
}

async function main() {
    // Clear the screen first
    // Note: Deno.consoleSize() might not work correctly after clearing the screen
    // with escape codes. It's better to get the size first.
    const kittyUtil = new KittyUtil();
    kittyUtil.clearScreen();

    // Create the scene
    const root = createDemoScene();

    // Create a renderer and render the scene
    const renderer = new Renderer(root, kittyUtil);
    renderer.renderScene();

    // Set up input handling to exit on Enter
    const inputManager = new InputManager();
    // Create a dummy scene object for the InputManager to interact with
    // In a real app, you'd pass the actual Scene instance if it managed focus/input
    const dummyScene = {
        handleKey: (key: string) => {
            if (key === 'enter') {
                console.log("\nExiting...");
                inputManager.stop(); // Stop the input handler
                // Reset terminal settings before exiting
                kittyUtil.resetColors();
                // Deno.exit(0); // Exit the process
            }
            return false; // Key not handled by dummy scene
        }
    };
    inputManager.setScene(dummyScene);


    // Start capturing input
    await inputManager.start();

    // Keep the program running until inputManager is stopped
    // A simple way is to wait indefinitely or until a signal is received
    // Deno does not have a direct equivalent to Python's input() that
    // works well with raw terminal mode and async input handling.
    // We'll rely on the input handler to stop the loop and the program
    // to exit when the main async function completes.

    // To keep the process alive while the input handler runs in the background:
    // We can use a promise that never resolves or wait for a signal.
    // For a simple demo, we can just wait for the input handler to stop.
    // The input handler's _inputLoop promise will keep the process alive.
    // When inputManager.stop() is called, the loop will break and the promise will resolve.

    // Wait for the input loop promise to resolve (when stop is called)
    if (inputManager["keyboardHandler"]["inputLoopPromise"]) {
         await inputManager["keyboardHandler"]["inputLoopPromise"];
    }


    // Reset terminal settings (also handled in inputManager.stop() and signal handler)
    kittyUtil.resetColors();
    // Show cursor (also handled in inputManager.stop() and signal handler)
    // Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));

}

// Set up signal handler for clean exit (Ctrl+C)
// Note: Deno's signal handling is different from Python's.
// We need to listen for the "SIGINT" signal.
Deno.addSignalListener("SIGINT", () => {
    console.log("\nExiting...");
    // Reset terminal settings before exiting
    const kittyUtil = new KittyUtil();
    kittyUtil.resetColors();
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
    Deno.exit(0);
});


// Run the main function
main().catch((err) => {
    console.error("Application error:", err);
    // Ensure terminal is reset on error
    const kittyUtil = new KittyUtil();
    kittyUtil.resetColors();
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
    Deno.exit(1);
});