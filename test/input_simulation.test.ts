import { InputManager } from "../src/lib/input_handler.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Mock Scene class to track handled keys
class MockScene {
    public handledKeys: string[] = [];

    handleKey(key: string): boolean {
        this.handledKeys.push(key);
        return true; // Indicate that the key was handled
    }
}

Deno.test("InputManager.simulateKeyPress calls scene handleKey", () => {
    const mockScene = new MockScene();
    const inputManager = new InputManager(mockScene);

    const testKey = "test_key";
    inputManager.simulateKeyPress(testKey);

    assertEquals(mockScene.handledKeys.length, 1, "handleKey should be called once");
    assertEquals(mockScene.handledKeys[0], testKey, `handleKey should be called with "${testKey}"`);
});

Deno.test("InputManager.simulateKeyPress calls global handler", () => {
    const mockScene = new MockScene(); // Still need a scene for InputManager constructor
    const inputManager = new InputManager(mockScene);

    let globalHandlerCalled = false;
    let receivedKey: string | undefined;

    const globalHandler = (key: string) => {
        globalHandlerCalled = true;
        receivedKey = key;
    };

    const testKey = "global_test_key";
    inputManager.registerGlobalHandler(testKey, globalHandler);
    inputManager.simulateKeyPress(testKey);

    assertEquals(globalHandlerCalled, true, "Global handler should be called");
    assertEquals(receivedKey, testKey, `Global handler should receive "${testKey}"`);
});