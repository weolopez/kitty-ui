// Input Components module for the Ghostty Graphics Library.
// This module defines interactive components that can handle keyboard input,
// such as buttons, text inputs, and tab containers.

import { Node } from "./node.ts";
import { Group, Rectangle, Text } from "./components.ts";
import { KittyUtil } from "./kitty.ts"; // Assuming KittyUtil is in kitty.ts

// Define types for clarity
type Size = [number, number]; // [width, height]
type Position = [number, number]; // [x, y]
type Color = [number, number, number]; // [r, g, b]
type KeyHandler = (key: string) => boolean; // Handlers return boolean if key was handled
type ClickHandler = () => void;
type ChangeHandler = (value: string) => void;

export interface FocusableComponent {
    isFocused: boolean;
    onFocus(): void;
    onBlur(): void;
    handleKey(key: string): boolean;
}

// Helper function to find the nearest Scene ancestor
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


export class Button extends Group implements FocusableComponent {
    textStr: string;
    color: Color;
    focusColor: Color;
    textColor: Color;
    onClick: ClickHandler | undefined;
    size: Size;
    background: Rectangle;
    text: Text;
    isFocused: boolean;

    constructor(
        text: string,
        position: Position = [0, 0],
        size: Size | undefined = undefined,
        color: Color = [100, 100, 200],
        textColor: Color = [255, 255, 255],
        focusColor: Color = [150, 150, 255],
        onClick: ClickHandler | undefined = undefined
    ) {
        super(position);
        // Mixin initialization is not needed in TypeScript classes with implements

        this.textStr = text;
        this.color = color;
        this.focusColor = focusColor;
        this.textColor = textColor;
        this.onClick = onClick;
        this.isFocused = false;

        // Calculate size based on text if not provided
        if (size === undefined) {
            this.size = [text.length + 4, 3]; // Add padding
        } else {
            this.size = size;
        }

        // Create the button background
        this.background = new Rectangle(
            this.size,
            this.color,
            true,
            [0, 0]
        );
        this.addChild(this.background);

        // Create the button text
        const textX = Math.max(1, Math.floor((this.size[0] - text.length) / 2));
        const textY = Math.floor(this.size[1] / 2);
        this.text = new Text(
            text,
            this.textColor,
            [textX, textY]
        );
        this.addChild(this.text);
    }

    onFocus(): void {
        this.isFocused = true;
        this.background.color = this.focusColor;
        // Trigger a scene re-render if possible
        const scene = findScene(this);
        if (scene) {
            scene.renderScene();
        }
    }

    onBlur(): void {
        this.isFocused = false;
        this.background.color = this.color;
        // Trigger a scene re-render if possible
        const scene = findScene(this);
        if (scene) {
            scene.renderScene();
        }
    }

    handleKey(key: string): boolean {
        if (this.isFocused && (key === 'enter' || key === ' ' || key === 'space') && this.onClick) {
            this.onClick();

            // Trigger a scene re-render if possible
            const scene = findScene(this);
            if (scene) {
                scene.renderScene();
            }

            return true;
        }
        return false;
    }
}


export class TextInput extends Group implements FocusableComponent {
    size: Size;
    color: Color;
    focusColor: Color;
    textColor: Color;
    placeholder: string;
    value: string;
    cursorPos: number;
    onChange: ChangeHandler | undefined;
    private keyboardHandlers: { [key: string]: KeyHandler };
    background: Rectangle;
    text: Text;
    cursor: Text;
    isFocused: boolean;


    constructor(
        position: Position = [0, 0],
        size: Size = [20, 3],
        color: Color = [50, 50, 70],
        textColor: Color = [255, 255, 255],
        focusColor: Color = [70, 70, 100],
        placeholder: string = "",
        value: string = "",
        onChange: ChangeHandler | undefined = undefined
    ) {
        super(position);
        // Mixin initialization is not needed in TypeScript classes with implements

        this.size = size;
        this.color = color;
        this.focusColor = focusColor;
        this.textColor = textColor;
        this.placeholder = placeholder;
        this.value = value;
        this.cursorPos = value.length;
        this.onChange = onChange;
        this.keyboardHandlers = {};
        this.isFocused = false;

        // Create the input background
        this.background = new Rectangle(
            this.size,
            this.color,
            true,
            [0, 0]
        );
        this.addChild(this.background);

        // Create the input text
        const textY = Math.floor(this.size[1] / 2);
        this.text = new Text(
            this.value || this.placeholder,
            this.value ? this.textColor : [150, 150, 150], // Dimmer color for placeholder
            [1, textY]
        );
        this.addChild(this.text);

        // Create the cursor
        this.cursor = new Text(
            "|",
            this.textColor,
            [1 + this.cursorPos, textY]
        );
        this.cursor.visible = false;
        this.addChild(this.cursor);
    }

    onFocus(): void {
        this.isFocused = true;
        this.background.color = this.focusColor;
        this.cursor.visible = true;
        this._updateTextDisplay(); // Ensure cursor position is correct on focus
        // Trigger a scene re-render if possible
        const scene = findScene(this);
        if (scene) {
            scene.renderScene();
        }
    }

    onBlur(): void {
        this.isFocused = false;
        this.background.color = this.color;
        this.cursor.visible = false;
        this._updateTextDisplay(); // Hide cursor on blur
        // Trigger a scene re-render if possible
        const scene = findScene(this);
        if (scene) {
            scene.renderScene();
        }
    }

    private _updateTextDisplay(): void {
        // Update text
        if (this.value) {
            this.text.text = this.value;
            this.text.color = this.textColor;
        } else {
            this.text.text = this.placeholder;
            this.text.color = [150, 150, 150]; // Dimmer color for placeholder
        }

        // Update cursor position
        const textY = Math.floor(this.size[1] / 2);
        this.cursor.position = [1 + this.cursorPos, textY];
    }

    registerKeyboardHandler(key: string, handler: KeyHandler): void {
        this.keyboardHandlers[key] = handler;
    }

    handleKey(key: string): boolean {
        if (!this.isFocused) {
            return false;
        }

        // Check for registered handlers first
        if (this.keyboardHandlers[key]) {
            if (this.keyboardHandlers[key](key)) {
                 // Trigger a scene re-render if possible if handler handled the key
                const scene = findScene(this);
                if (scene) {
                    scene.renderScene();
                }
                return true;
            }
        }

        let handled = false;

        if (key === 'backspace') {
            if (this.cursorPos > 0) {
                this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
                this.cursorPos -= 1;
                handled = true;
            }
        } else if (key === 'delete') {
            if (this.cursorPos < this.value.length) {
                this.value = this.value.slice(0, this.cursorPos) + this.value.slice(this.cursorPos + 1);
                handled = true;
            }
        } else if (key === 'left') {
            if (this.cursorPos > 0) {
                this.cursorPos -= 1;
                handled = true;
            }
        } else if (key === 'right') {
            if (this.cursorPos < this.value.length) {
                this.cursorPos += 1;
                handled = true;
            }
        } else if (key === 'home') {
            this.cursorPos = 0;
            handled = true;
        } else if (key === 'end') {
            this.cursorPos = this.value.length;
            handled = true;
        } else if (key.length === 1) { // Single character
            // Check if we have room for more characters (leaving room for cursor and padding)
            if (this.value.length < this.size[0] - 3) {
                this.value = this.value.slice(0, this.cursorPos) + key + this.value.slice(this.cursorPos);
                this.cursorPos += 1;
                handled = true;
            }
        }

        if (handled) {
            // Update the display
            this._updateTextDisplay();

            // Notify change listeners
            if (this.onChange && (key === 'backspace' || key === 'delete' || key.length === 1)) {
                this.onChange(this.value);
            }

            // Trigger a scene re-render if possible
            const scene = findScene(this);
            if (scene) {
                scene.renderScene();
            }

            return true;
        }

        return false;
    }
}


export class TabContainer extends Group {
    size: Size;
    tabHeight: number;
    color: Color;
    activeTabColor: Color;
    inactiveTabColor: Color;
    tabs: { title: string; content: Node; button: Group; background: Rectangle }[];
    activeTabIndex: number;
    background: Rectangle;
    tabBar: Group;
    contentArea: Group;

    constructor(
        position: Position = [0, 0],
        size: Size = [40, 20],
        tabHeight: number = 3,
        color: Color = [40, 40, 60],
        activeTabColor: Color = [60, 60, 100],
        inactiveTabColor: Color = [50, 50, 80]
    ) {
        super(position);

        this.size = size;
        this.tabHeight = tabHeight;
        this.color = color;
        this.activeTabColor = activeTabColor;
        this.inactiveTabColor = inactiveTabColor;

        this.tabs = [];
        this.activeTabIndex = 0;

        // Create the container background
        this.background = new Rectangle(
            size,
            color,
            true,
            [0, 0]
        );
        this.addChild(this.background);

        // Create the tab bar
        this.tabBar = new Group([0, 0]);
        this.addChild(this.tabBar);

        // Create the content area
        this.contentArea = new Group([0, tabHeight]);
        this.addChild(this.contentArea);
    }

    addTab(title: string, content: Node): void {
        // Calculate tab width based on number of tabs
        const tabWidth = Math.max(10, Math.min(20, Math.floor(this.size[0] / (this.tabs.length + 1))));

        // Create tab button
        const tabButton = new Group([this.tabs.length * tabWidth, 0]);

        // Tab background
        const tabBgColor = this.tabs.length === this.activeTabIndex ? this.activeTabColor : this.inactiveTabColor;
        const tabBg = new Rectangle(
            [tabWidth, this.tabHeight],
            tabBgColor,
            true,
            [0, 0]
        );
        tabButton.addChild(tabBg);

        // Tab title
        const textX = Math.max(1, Math.floor((tabWidth - title.length) / 2));
        const tabTitle = new Text(
            title,
            [255, 255, 255],
            [textX, Math.floor(this.tabHeight / 2)]
        );
        tabButton.addChild(tabTitle);

        // Add tab button to tab bar
        this.tabBar.addChild(tabButton);

        // Store tab info
        const tabIndex = this.tabs.length;
        this.tabs.push({
            title: title,
            content: content,
            button: tabButton,
            background: tabBg
        });

        // Set up click handler for the tab (placeholder for future mouse support)
        // const onTabClick = (idx: number = tabIndex) => {
        //     this.setActiveTab(idx);
        // };

        // Add content to content area if this is the active tab
        if (tabIndex === this.activeTabIndex) {
            this.contentArea.addChild(content);
        }
    }

    setActiveTab(index: number): void {
        if (index >= 0 && index < this.tabs.length) {
            // Remove current active tab content
            if (this.activeTabIndex < this.tabs.length) {
                const oldTab = this.tabs[this.activeTabIndex];
                this.contentArea.removeChild(oldTab.content);
                oldTab.background.color = this.inactiveTabColor;
            }

            // Set new active tab
            this.activeTabIndex = index;
            const newTab = this.tabs[index];
            newTab.background.color = this.activeTabColor;
            this.contentArea.addChild(newTab.content);

            // Trigger a scene re-render if possible
            const scene = findScene(this);
            if (scene) {
                scene.renderScene();
            }
        }
    }

    handleKey(key: string): boolean {
        // Allow the active tab's content to handle the key first if it's focusable
        const activeTabContent = this.tabs[this.activeTabIndex]?.content;
        if (activeTabContent && typeof (activeTabContent as any).handleKey === 'function') {
             if ((activeTabContent as any).handleKey(key)) {
                 return true; // Key was handled by the active tab content
             }
        }


        if (key === 'tab') {
            // Cycle through tabs
            const nextTab = (this.activeTabIndex + 1) % this.tabs.length;
            this.setActiveTab(nextTab);
            return true;
        }
        return false;
    }
}