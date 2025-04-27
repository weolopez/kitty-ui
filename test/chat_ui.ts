// Simple Chat UI Example for the Ghostty Graphics Library.
// This script demonstrates how to create a basic chat interface using the library's components.

import { Node } from "../src/lib/node.ts";
import { Rectangle, Text, Group } from "../src/lib/components.ts";
import { Scene } from "../src/lib/scene.ts";
import { Button, TextInput, FocusableComponent } from "../src/lib/input_components.ts";
import { InputManager } from "../src/lib/input_handler.ts";
import { KittyUtil } from "../src/lib/kitty.ts"; // Import KittyUtil for terminal reset

// Define types for clarity
type Size = [number, number]; // [width, height]
type Position = [number, number]; // [x, y]
type Color = [number, number, number]; // [r, g, b]

// Define user colors
const USER_COLORS: Color[] = [
    [255, 100, 100], // Reddish
    [100, 255, 100], // Greenish
    [100, 100, 255], // Blueish
    [255, 255, 100], // Yellowish
];

class ChatDisplay extends Group {
    size: Size;
    messages: Text[];
    maxMessages: number;

    constructor(size: Size, position: Position = [0, 0]) {
        super(position);
        this.size = size;
        this.messages = [];
        this.maxMessages = size[1] - 2; // Leave space for padding
    }

    addMessage(user: string, text: string, color: Color): void {
        // Format the message
        const formattedMessage = `${user}: ${text}`;

        // Create a Text component for the message
        const messageText = new Text(
            formattedMessage,
            color,
            [1, this.messages.length] // Position based on current number of messages
        );
        this.addChild(messageText);
        this.messages.push(messageText);

        // Remove oldest message if exceeding max and adjust positions
        if (this.messages.length > this.maxMessages) {
            const oldestMessage = this.messages.shift(); // Remove from the beginning
            if (oldestMessage) {
                this.removeChild(oldestMessage);
            }
            // Adjust positions of remaining messages
            for (let i = 0; i < this.messages.length; i++) {
                this.messages[i].position = [1, i];
            }
        } else {
             // If not exceeding max, just update the position of the new message
             messageText.position = [1, this.messages.length - 1];
        }
    }
}


async function main() {
    // Clear the screen first
    const kittyUtil = new KittyUtil();
    kittyUtil.clearScreen();

    // Create a scene
    const scene = new Scene(undefined, [0, 0], true, [30, 30, 50]);

    // Create a chat display area
    const chatDisplayHeight = scene.size[1] - 6; // Leave space for input and header/footer
    const chatDisplay = new ChatDisplay(
        [scene.size[0], chatDisplayHeight],
        [0, 3] // Below header
    );
    scene.addChild(chatDisplay);

    // Create input area
    const inputArea = new Group([0, scene.size[1] - 3]);
    scene.addChild(inputArea);

    // Input area background
    const inputBg = new Rectangle(
        [scene.size[0], 3],
        [40, 40, 60], // Slightly different background
        true,
        [0, 0]
    );
    inputArea.addChild(inputBg); // Add background first

    // Message input field (adjust position for padding/centering)
    const messageInput = new TextInput(
        [1, 1], // Centered vertically in the 3-row area
        [scene.size[0] - 12, 1], // Height adjusted to 1 for single line input
        [50, 50, 70],
        [255, 255, 255],
        [70, 70, 100],
        "Enter your message"
    );
    inputArea.addChild(messageInput);

    // Send button (adjust position for padding/centering)
    const sendMessage = () => {
        const message = messageInput.value;
        if (message) {
            // For this example, cycle through users/colors
            const currentUserIndex = chatDisplay.messages.length % USER_COLORS.length;
            const userColor = USER_COLORS[currentUserIndex];
            const userName = `User${currentUserIndex + 1}`; // Simple user naming

            chatDisplay.addMessage(userName, message, userColor);
            messageInput.value = "";
            // Manually update display after clearing (accessing private method for now)
            (messageInput as any)["_updateTextDisplay"]();
            scene.renderScene(); // Re-render the scene
        }
    };

    const sendButton = new Button(
        "Send",
        [scene.size[0] - 10, 1], // Centered vertically
        [8, 1], // Height adjusted to 1
        [100, 100, 200],
        [255, 255, 255],
        [150, 150, 255],
        sendMessage
    );
    inputArea.addChild(sendButton);

    // Set up input manager
    const inputManager = new InputManager(scene);

    // Set initial focus to the message input
    scene.setFocus(messageInput);

    // Register Enter key to send message
    // Assuming TextInput has a registerKeyboardHandler method
    messageInput.registerKeyboardHandler('enter', () => {
        sendMessage();
        return true; // Indicate that the key was handled
    });

    // Flag to control the main loop
    let running = true;

    const exitApp = () => {
        running = false;
    };

    // Register Escape key to exit
    scene.registerKeyboardHandler('escape', exitApp);

    // Render the scene
    scene.renderScene();

    // Start capturing input
    await inputManager.start();

    // Keep the program running until the flag is set to False
    while (running) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent busy loop
    }

    // Clean up
    await inputManager.stop();
    // Reset terminal
    kittyUtil.resetColors();
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
}

// Set up signal handler for clean exit (Ctrl+C)
Deno.addSignalListener("SIGINT", async () => {
    console.log("\nExiting...");
    // Reset terminal settings before exiting
    const kittyUtil = new KittyUtil();
    kittyUtil.resetColors();
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
    Deno.exit(0);
});


// Run the main function
main().catch(async (err) => {
    console.error("Application error:", err);
    // Ensure terminal is reset on error
    const kittyUtil = new KittyUtil();
    kittyUtil.resetColors();
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
    Deno.exit(1);
});