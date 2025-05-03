import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
    InputManager,
    Scene,
    TabContainer,
    TextInput,
    Button,
    Group,
    Text,
    Node // Import Node for type checking
} from "../src/lib/mod.ts";

// Mock Deno.consoleSize for Scene initialization
const originalConsoleSize = Deno.consoleSize;
Deno.consoleSize = () => ({ columns: 80, rows: 24 });

// Mock Deno.stdout.writeSync to prevent actual terminal output during tests
const originalWriteSync = Deno.stdout.writeSync;
Deno.stdout.writeSync = (data: Uint8Array) => {
    // console.log("Mock writeSync:", new TextDecoder().decode(data)); // Optional: log output during testing
    return data.length;
};

// Helper function to find the nearest Scene ancestor (copied from interactive_demo for test context)
function findScene(node: Node): Scene | null {
    let currentNode: Node | null = node;
    while (currentNode) {
        // Check if this node is a Scene
        if (currentNode instanceof Scene) {
            return currentNode;
        }
        // Move up to the parent
        currentNode = currentNode.parent;
    }
    return null;
}


Deno.test("Interactive Demo Components: Tab navigation and Input", async () => {
    // Create a simple scene
    const scene = new Scene(undefined, [0, 0], true, [20, 20, 40]);

    // Create a tab container
    const tabContainer = new TabContainer(
        [0, 0],
        [80, 20], // Use mock terminal size
        3,
        [30, 30, 50],
        [60, 60, 100],
        [40, 40, 70]
    );
    scene.addChild(tabContainer);

    // Create content for a tab with focusable elements
    const tabContent = new Group();

    const textInput = new TextInput(
        [5, 5],
        [20, 3],
        [50, 50, 70],
        [255, 255, 255],
        [70, 70, 100],
        "Initial text"
    );
    tabContent.addChild(textInput);

    let buttonClicked = false;
    const button = new Button(
        "Click Me",
        [5, 10],
        [10, 3],
        [50, 100, 50],
        [255, 255, 255],
        [70, 150, 70],
        () => {
            buttonClicked = true;
            // In a real scenario, this would trigger a scene render,
            // but for the test, we just track the state.
        }
    );
    tabContent.addChild(button);

    const statusText = new Text("", [255, 255, 255], [5, 15]);
    tabContent.addChild(statusText);


    tabContainer.addTab("Test Tab", tabContent);

    // Ensure the scene is set for components to find it
    scene.renderScene(); // This also sets the scene on children

    // Set initial focus
    scene.focusedComponent = textInput;

    // Create an input manager
    const inputManager = new InputManager(scene);

    // Simulate Tab presses to navigate focus
    // Initial focus should be the first focusable element in the first tab content
    assertEquals(scene.focusedComponent, textInput, "Initial focus should be the TextInput");

    // Simulate Tab to move focus to the button
    inputManager.simulateKeyPress("tab");
    assertEquals(scene.focusedComponent, button, "Focus should move to the Button after first Tab");

    // Simulate Tab again to cycle focus (should go back to the first focusable in the tab content)
    inputManager.simulateKeyPress("tab");
    assertEquals(scene.focusedComponent, textInput, "Focus should cycle back to TextInput after second Tab");

    // Simulate typing into the text input
    inputManager.simulateKeyPress("a");
    inputManager.simulateKeyPress("b");
    inputManager.simulateKeyPress("c");
    assertEquals(textInput.value, "abc", "TextInput value should update after typing");

    // Simulate Backspace
    inputManager.simulateKeyPress("backspace");
    assertEquals(textInput.value, "ab", "TextInput value should update after backspace");

    // Simulate Enter on the button (focus needs to be on the button)
    inputManager.simulateKeyPress("tab"); // Move focus back to button
    assertEquals(scene.focusedComponent, button, "Focus should be on the Button before activating");
    inputManager.simulateKeyPress("enter");
    assertEquals(buttonClicked, true, "Button click handler should be called on Enter");

    // Simulate Space on the button (focus needs to be on the button)
    buttonClicked = false; // Reset flag
    inputManager.simulateKeyPress(" "); // Simulate space
    assertEquals(buttonClicked, true, "Button click handler should be called on Space");


    // Clean up mocks
    Deno.consoleSize = originalConsoleSize;
    Deno.stdout.writeSync = originalWriteSync;
});