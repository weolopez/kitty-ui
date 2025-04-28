# Keyboard Control Refactoring Plan

**Goal:** Centralize keyboard control logic within the `Scene` and `Component` framework, enabling robust focus management and navigation.

**Plan:**

1.  **Enhance `FocusableComponent` Interface:**
    *   Add an optional `tabIndex: number` property to the `FocusableComponent` interface to allow overriding the default tab order.
    *   Consider adding methods like `onKeyPress(key: string): boolean` to allow components to handle specific keys before the Scene's default handling.

2.  **Modify `Node` and `Group` for Focus Management:**
    *   Add a method `getTabbableChildren(): FocusableComponent[]` to `Group` (and potentially `Node` as a base) that recursively finds all focusable children within the group's hierarchy, ordered by their addition to the parent, and then by `tabIndex`.
    *   This method will be crucial for the Scene to determine the tab order.

3.  **Update `Scene` for Centralized Input and Focus Management:**
    *   The `Scene` will maintain a list of all focusable components within its hierarchy, updated whenever components are added or removed.
    *   Implement `handleKey(key: string)` in `Scene` to:
        *   First, check if a `focusedComponent` exists and call its `handleKey` method. If it returns `true`, the key was handled.
        *   If not handled by the focused component, implement the default tab navigation logic (e.g., on 'tab' key press, find the next focusable component using the `getTabbableChildren` method and set focus). Handle 'shift_tab' for reverse tabbing.
        *   Implement basic arrow key navigation logic. This could involve finding the nearest focusable component in the direction of the arrow key based on position.
        *   If still not handled, check for Scene-level registered keyboard handlers.
    *   The `Scene` will be responsible for setting and managing the `focusedComponent`.
    *   The `InputManager` will primarily route raw key presses to the active `Scene`'s `handleKey` method.

4.  **Refine `Button` and `TextInput`:**
    *   Ensure `Button` and `TextInput` correctly implement the `FocusableComponent` interface.
    *   Update their `handleKey` methods to return `true` if they handle the key (e.g., 'enter' or 'space' for Button, character input for TextInput) and `false` otherwise, allowing the Scene to potentially handle it.
    *   Add the optional `tabIndex` property to their constructors and classes.

5.  **Update `TabContainer`:**
    *   Modify `TabContainer` to manage focus among its tabs and potentially delegate focus management within the active tab's content.
    *   When a tab is active, the `TabContainer` could set the focus to the first focusable component within that tab's content, or allow the Scene's tab navigation to enter the tab content's focusable elements.

**Mermaid Diagram:**

```mermaid
graph TD
    A[InputManager] --> B{Keyboard Input};
    B --> C[Scene];
    C --> D{Handle Key};
    D --> E{Focused Component?};
    E -- Yes --> F[Focused Component];
    F --> G{Component handles key?};
    G -- Yes --> H[Key Handled];
    G -- No --> I{Scene handles key?};
    I -- Yes --> H;
    I -- No --> J[Key Not Handled];
    E -- No --> I;
    C --> K[Focusable Components List];
    C --> L[Tab Navigation Logic];
    C --> M[Arrow Key Navigation Logic];
    K --> L;
    K --> M;
    C --> N[Scene Keyboard Handlers];
    N --> I;
    F --> O[onFocus/onBlur];
    C --> O;
    Subgraph Components
        F --> P[Button];
        F --> Q[TextInput];
        F --> R[TabContainer];
        R --> S[Tab Content];
        S --> F;
    End