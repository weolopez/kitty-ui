import { InputManager } from "../src/lib/input_handler.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Scene } from "../src/lib/scene.ts";
import { TextInput } from "../src/lib/input_components.ts";
import { ChatDisplay } from "../test/chat_ui.ts"; // Import ChatDisplay from the demo

// Mock Scene class for testing purposes
class MockSceneForChatTest {
    public focusedComponent: any = null; // Track focused component
    public children: any[] = []; // Mock children array

    addChild(child: any): void {
        this.children.push(child);
    }

    setFocus(component: any): void {
        if (this.focusedComponent && typeof (this.focusedComponent as any).onBlur === 'function') {
            (this.focusedComponent as any).onBlur();
        }
        this.focusedComponent = component;
        if (this.focusedComponent && typeof (this.focusedComponent as any).onFocus === 'function') {
            (this.focusedComponent as any).onFocus();
        }
    }

    handleKey(key: string): boolean {
        if (this.focusedComponent && typeof this.focusedComponent.handleKey === 'function') {
            return this.focusedComponent.handleKey(key);
        }
        return false;
    }

    // Mock renderScene as it's not needed for input simulation tests
    renderScene(): void {
        // Do nothing
    }
}

Deno.test("Chat UI: Simulate typing into TextInput", () => {
    const mockScene = new MockSceneForChatTest();

    // Create a TextInput instance
    const messageInput = new TextInput(
        [0, 0], // Position
        [10, 1], // Size
        [0, 0, 0], // Background color
        [255, 255, 255], // Text color
        [50, 50, 50], // Cursor color
        "Placeholder" // Placeholder text
    );

    // Set focus to the text input
    mockScene.setFocus(messageInput);

    // Simulate typing "hello" by directly calling handleKey
    messageInput.handleKey("h");
    messageInput.handleKey("e");
    messageInput.handleKey("l");
    messageInput.handleKey("l");
    messageInput.handleKey("o");

    assertEquals(messageInput.value, "hello", "TextInput value should be 'hello' after typing");
});

Deno.test("Chat UI: Simulate sending message with Enter key", () => {
    const mockScene = new MockSceneForChatTest();

    // Create a ChatDisplay instance to observe messages
    const chatDisplay = new ChatDisplay([20, 10]);
    mockScene.addChild(chatDisplay); // Add to scene so it can be accessed if needed

    // Create a TextInput instance
    const messageInput = new TextInput(
        [0, 0], // Position
        [10, 1], // Size
        [0, 0, 0], // Background color
        [255, 255, 255], // Text color
        [50, 50, 50], // Cursor color
        "Placeholder" // Placeholder text
    );

    // Mock the sendMessage function that the Enter key handler calls
    let messageSent = false;
    let sentMessageContent: string | undefined;

    // Replace the internal sendMessage logic for testing
    (messageInput as any).registerKeyboardHandler('enter', () => {
        messageSent = true;
        sentMessageContent = messageInput.value;
        // In a real scenario, this would call the external send message logic
        // For this test, we just track that it was triggered and with what value
        return true; // Indicate handled
    });


    // Set focus to the text input
    mockScene.setFocus(messageInput);

    // Simulate typing a message by directly calling handleKey
    messageInput.handleKey("t");
    messageInput.handleKey("e");
    messageInput.handleKey("s");
    messageInput.handleKey("t");

    // Simulate pressing Enter by directly calling handleKey
    messageInput.handleKey("enter");

    assertEquals(messageSent, true, "sendMessage function should be called when Enter is pressed");
    assertEquals(sentMessageContent, "test", "sendMessage should receive the correct message content");
    // Note: We are not testing the ChatDisplay's addMessage directly here,
    // but rather that the TextInput's Enter handler triggers the intended action.
});