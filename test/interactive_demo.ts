// Interactive Demo of the Ghostty Graphics Library.
// This script demonstrates the interactive components and keyboard input handling.

import { Node } from "../src/lib/node.ts";
import { Rectangle, Text, Group } from "../src/lib/components.ts"; // Assuming Image is not used in this simple demo
import { Scene } from "../src/lib/scene.ts";
import { Button, TextInput, TabContainer, FocusableComponent } from "../src/lib/input_components.ts";
import { InputManager } from "../src/lib/input_handler.ts";
import { KittyUtil } from "../src/lib/kitty.ts"; // Import KittyUtil for terminal reset

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

// Define a type for the content groups in tabs that have focusable components
interface FocusableGroup extends Group {
    focusableComponents: FocusableComponent[];
    currentFocusIndex: number;
}


function createFormTab(): FocusableGroup {
    const content = new Group() as FocusableGroup; // Cast to FocusableGroup

    // Form title
    const title = new Text(
        "User Information Form",
        [220, 220, 255],
        [15, 2]
    );
    content.addChild(title);

    // Name field
    const nameLabel = new Text(
        "Name:",
        [200, 200, 255],
        [5, 5]
    );
    content.addChild(nameLabel);

    const nameInput = new TextInput(
        [15, 4],
        [30, 3],
        [50, 50, 70],
        [255, 255, 255],
        [70, 70, 100],
        "Enter your name"
    );
    content.addChild(nameInput);

    // Email field
    const emailLabel = new Text(
        "Email:",
        [200, 200, 255],
        [5, 9]
    );
    content.addChild(emailLabel);

    const emailInput = new TextInput(
        [15, 8],
        [30, 3],
        [50, 50, 70],
        [255, 255, 255],
        [70, 70, 100],
        "Enter your email"
    );
    content.addChild(emailInput);

    // Status message
    const status = new Text(
        "",
        [100, 255, 100],
        [5, 13]
    );
    content.addChild(status);

    // Submit button
    const onSubmit = () => {
        const name = nameInput.value;
        const email = emailInput.value;
        if (name && email) {
            status.text = `Form submitted: ${name}, ${email}`;
            status.color = [100, 255, 100]; // Green
        } else {
            status.text = "Please fill in all fields";
            status.color = [255, 100, 100]; // Red
        }
        // Re-render the scene to show status update
        const scene = findScene(content); // Use helper to find scene
        if (scene) {
            scene.renderScene();
        }
    };

    const submitButton = new Button(
        "Submit",
        [15, 12],
        [10, 3],
        [50, 100, 50],
        [255, 255, 255],
        [70, 150, 70],
        onSubmit
    );
    content.addChild(submitButton);

    // Clear button
    const onClear = () => {
        nameInput.value = "";
        emailInput.value = "";
        nameInput["_updateTextDisplay"](); // Access private method for now
        emailInput["_updateTextDisplay"](); // Access private method for now
        status.text = "Form cleared";
        status.color = [200, 200, 200]; // Gray
        // Re-render the scene to show cleared fields and status
        const scene = findScene(content); // Use helper to find scene
        if (scene) {
            scene.renderScene();
        }
    };

    const clearButton = new Button(
        "Clear",
        [30, 12],
        [10, 3],
        [100, 50, 50],
        [255, 255, 255],
        [150, 70, 70],
        onClear
    );
    content.addChild(clearButton);

    // Store focusable components for tab navigation
    content.focusableComponents = [nameInput, emailInput, submitButton, clearButton];
    content.currentFocusIndex = 0;

    return content;
}


function createButtonsTab(): FocusableGroup {
    const content = new Group() as FocusableGroup; // Cast to FocusableGroup

    // Tab title
    const title = new Text(
        "Button Examples",
        [220, 220, 255],
        [15, 2]
    );
    content.addChild(title);

    // Status text to show which button was clicked
    const status = new Text(
        "Click a button",
        [200, 200, 200],
        [10, 18]
    );
    content.addChild(status);

    // Create a grid of buttons with different colors
    const buttons: Button[] = [];
    const colors: Color[] = [
        [200, 50, 50],   // Red
        [50, 200, 50],   // Green
        [50, 50, 200],   // Blue
        [200, 200, 50],  // Yellow
        [200, 50, 200],  // Magenta
        [50, 200, 200],  // Cyan
    ];

    const colorNames = ["Red", "Green", "Blue", "Yellow", "Magenta", "Cyan"];

    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const row = Math.floor(i / 2);
        const col = i % 2;

        const x = 10 + col * 20;
        const y = 5 + row * 4;

        // Create a button with a color name
        const makeClickHandler = (colorName: string) => {
            return () => {
                // Update the status text
                status.text = `Clicked: ${colorName} button`;
                 // Re-render the scene to show status update
                const scene = findScene(content); // Use helper to find scene
                if (scene) {
                    scene.renderScene();
                }
            };
        };

        const button = new Button(
            colorNames[i],
            [x, y],
            [15, 3],
            color,
            [255, 255, 255],
            [Math.min(255, color[0] + 50), Math.min(255, color[1] + 50), Math.min(255, color[2] + 50)],
            makeClickHandler(colorNames[i])
        );
        content.addChild(button);
        buttons.push(button);
    }

    // Store focusable components for tab navigation
    content.focusableComponents = buttons;
    content.currentFocusIndex = 0;

    return content;
}


function createHelpTab(): FocusableGroup {
    const content = new Group() as FocusableGroup; // Cast to FocusableGroup

    // Tab title
    const title = new Text(
        "Keyboard Controls",
        [220, 220, 255],
        [15, 2]
    );
    content.addChild(title);

    // Keyboard shortcuts
    const shortcuts = [
        ["Tab", "Move between interactive elements"],
        ["Enter/Space", "Activate button"],
        ["Arrow Keys", "Navigate within text input"],
        ["Backspace", "Delete character in text input"],
        ["Escape", "Exit the application"],
    ];

    for (let i = 0; i < shortcuts.length; i++) {
        const [key, description] = shortcuts[i];
        // Key name
        const keyText = new Text(
            key,
            [200, 200, 255],
            [10, 5 + i * 2]
        );
        content.addChild(keyText);

        // Description
        const descText = new Text(
            description,
            [180, 180, 220],
            [25, 5 + i * 2]
        );
        content.addChild(descText);
    }

    // No focusable components in this tab
    content.focusableComponents = [];
    content.currentFocusIndex = 0;

    return content;
}

// Helper function to find the nearest Scene ancestor (copied from input_components for now)
function findScene(node: Node): any | null { // TODO: Define Scene type
    let currentNode: Node | null = node;
    while (currentNode) {
        // Check if this node is a Scene (assuming Scene has a renderScene method)
        if (typeof (currentNode as any).renderScene === 'function') {
            return currentNode;
        }
        // Move up to the parent
        currentNode = currentNode.parent;
    }
    return null;
}


async function main() {
    // Clear the screen first
    const kittyUtil = new KittyUtil();
    kittyUtil.clearScreen();

    // Create a scene
    const scene = new Scene(undefined, [0, 0], true, [20, 20, 40]);

    // Create a header
    const header = new Group([0, 0]);
    scene.addChild(header);

    // Header background
    const headerBg = new Rectangle(
        [scene.size[0], 3],
        [60, 60, 100],
        true,
        [0, 0]
    );
    header.addChild(headerBg);

    // Header title
    const title = new Text(
        "Ghostty Graphics Interactive Demo",
        [255, 255, 255],
        [Math.floor(scene.size[0] / 2) - 15, 1]
    );
    header.addChild(title);

    // Create a tab container
    const tabContainer = new TabContainer(
        [0, 3],
        [scene.size[0], scene.size[1] - 6],
        3,
        [30, 30, 50],
        [60, 60, 100],
        [40, 40, 70]
    );
    scene.addChild(tabContainer);

    // Add tabs
    const formTab = createFormTab();
    const buttonsTab = createButtonsTab();
    const helpTab = createHelpTab();

    tabContainer.addTab("Form", formTab);
    tabContainer.addTab("Buttons", buttonsTab);
    tabContainer.addTab("Help", helpTab);

    // Create a footer
    const footer = new Group([0, scene.size[1] - 3]);
    scene.addChild(footer);

    // Footer background
    const footerBg = new Rectangle(
        [scene.size[0], 3],
        [60, 60, 100],
        true,
        [0, 0]
    );
    footer.addChild(footerBg);

    // Footer text
    const footerText = new Text(
        "Press Tab to navigate, Enter to activate, Escape to exit",
        [200, 200, 255],
        [Math.floor(scene.size[0] / 2) - 25, 1]
    );
    footer.addChild(footerText);

    // Set up input manager
    const inputManager = new InputManager(scene);

    // Set up tab navigation
    let currentTabContent: FocusableGroup = formTab; // Initialize with the first tab content
    let currentFocusIndex = 0;

    const handleTabKey = () => {
        // Get the current tab's focusable components
        const focusableComponents = currentTabContent.focusableComponents;

        if (!focusableComponents || focusableComponents.length === 0) {
            return; // No focusable components in this tab
        }

        // Move to the next focusable component
        currentFocusIndex = (currentFocusIndex + 1) % focusableComponents.length;
        scene.setFocus(focusableComponents[currentFocusIndex]);
        scene.renderScene();
    };

    const handleTabChange = () => {
        // Update the current tab content
        const activeTab = tabContainer.tabs[tabContainer.activeTabIndex];
        if (activeTab && (activeTab.content as any).focusableComponents !== undefined) {
             currentTabContent = activeTab.content as FocusableGroup;
             currentFocusIndex = 0;

             // Focus the first component in the new tab if available
             if (currentTabContent.focusableComponents && currentTabContent.focusableComponents.length > 0) {
                 scene.setFocus(currentTabContent.focusableComponents[0]);
             } else {
                 scene.setFocus(null); // No focusable components in this tab
             }
        } else {
            // If the new tab content is not a FocusableGroup or has no focusable components
            currentTabContent = new Group() as FocusableGroup; // Create a dummy FocusableGroup
            currentTabContent.focusableComponents = [];
            currentTabContent.currentFocusIndex = 0;
            currentFocusIndex = 0;
            scene.setFocus(null); // No focus in this tab
        }


        scene.renderScene();
    };

    // Flag to control the main loop
    let running = true;

    const exitApp = () => {
        running = false;
    };

    // Register keyboard handlers
    scene.registerKeyboardHandler('tab', handleTabKey);
    scene.registerKeyboardHandler('escape', exitApp);

    // Set up tab container to call our handler when tabs change
    // We need to override the original setActiveTab method
    const originalSetActiveTab = tabContainer.setActiveTab.bind(tabContainer); // Bind to the instance

    tabContainer.setActiveTab = (index: number) => {
        originalSetActiveTab(index);
        handleTabChange();
    };


    // Initial focus
    if (formTab.focusableComponents && formTab.focusableComponents.length > 0) {
        scene.setFocus(formTab.focusableComponents[0]);
    }

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