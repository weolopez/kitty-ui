# Plan: Enhance Input Handling for Debugging and Scriptability

**Objective:** Add a mechanism to the `InputManager` to allow external simulation of processed key presses to enhance debugging, scriptability, and developer ergonomics.

**Plan:**

1.  **Add a `simulateKeyPress` method to `InputManager`:** Introduce a new public method, `simulateKeyPress(key: string): void`, within the `InputManager` class in `src/lib/input_handler.ts`.
2.  **Implement `simulateKeyPress`:** This method will directly call the existing `InputManager.handleKey(key)` method. This ensures that a simulated key press goes through the same dispatching logic as a real key press (checking global handlers and then the scene's handler), bypassing the `KeyboardInputHandler`'s raw input reading loop.
3.  **Document the new method:** Add JSDoc comments to the `simulateKeyPress` method explaining its purpose and how to use it.
4.  **Illustrate the flow:** Use a Mermaid diagram to visually represent how a simulated key press fits into the existing input handling architecture compared to a real key press.
5.  **Provide examples:** Show how this new method can be used in test files or scripts to simulate sequences of key presses for testing UI components, tab navigation, etc.

**Mermaid Diagram illustrating the input flow:**

```mermaid
graph LR
    A[Real Key Press] --> B(Terminal Input);
    B --> C(KeyboardInputHandler);
    C --> D{_handleInput<br/>(Parse Raw Input)};
    D --> E{_handleKey<br/>(Get Processed Key)};
    E --> F(InputManager.handleKey);

    G[External Script/Test] --> H(InputManager.simulateKeyPress);
    H --> F;

    F --> I{Global Handlers};
    F --> J{Scene.handleKey};

    I --> K[Application Logic];
    J --> K;
```

**Example Usage (Conceptual):**

In a test file (`test/my_ui_test.ts`):

```typescript
import { InputManager } from "../src/lib/input_handler.ts";
import { MyTestScene } from "./my_test_scene.ts"; // Assuming a test scene

// Setup
const scene = new MyTestScene();
const inputManager = new InputManager(scene);

// Simulate key presses
inputManager.simulateKeyPress("tab"); // Simulate pressing the Tab key
inputManager.simulateKeyPress("enter"); // Simulate pressing Enter
inputManager.simulateKeyPress("a"); // Simulate pressing the 'a' key
inputManager.simulateKeyPress("right"); // Simulate pressing the Right Arrow key

// Assertions (check the state of the scene or UI elements)
// assert...