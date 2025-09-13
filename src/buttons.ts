import * as vscode from 'vscode';

/**
 * Represents a button with its properties.
 * The `id` is a unique identifier.
 */
export interface Button {
    id: number;
    name: string;
    img: string;
    text: string;
}

const BUTTONS_KEY = 'buttons';
const NEXT_ID_KEY = 'nextId';

let context: vscode.ExtensionContext;

/**
 * Initializes the module with the extension context.
 */
export function initializeButtonModule(ctx: vscode.ExtensionContext) {
    context = ctx;
    if (context.globalState.get(NEXT_ID_KEY) === undefined) {
        context.globalState.update(NEXT_ID_KEY, 2);
    }
    if (!context.globalState.get<Button[]>(BUTTONS_KEY)) {
        context.globalState.update(BUTTONS_KEY, [
            {
                id: 1,
                name: 'Example Button 1',
                img: 'https://via.placeholder.com/150',
                text: 'This is a very long text description for the first example button. It can contain paragraphs and lots of content.',
            },
        ]);
    }
}

function getButtons(): Button[] {
    return context.globalState.get<Button[]>(BUTTONS_KEY) || [];
}

function setButtons(buttons: Button[]) {
    context.globalState.update(BUTTONS_KEY, buttons);
}

function getNextId(): number {
    return context.globalState.get<number>(NEXT_ID_KEY) || 1;
}

function incrementNextId() {
    const nextId = getNextId() + 1;
    context.globalState.update(NEXT_ID_KEY, nextId);
}

/**
 * Creates a new button and adds it to the database.
 */
export function createButton(data: Omit<Button, 'id'>): Button {
    const buttons = getButtons();
    const id = getNextId();
    const newButton: Button = { id, ...data };
    buttons.push(newButton);
    setButtons(buttons);
    incrementNextId();
    return newButton;
}

/**
 * Retrieves all buttons from the database.
 */
export function getAllButtons(): Button[] {
    return getButtons();
}

/**
 * Retrieves a single button by its ID.
 */
export function getButtonById(id: number): Button | undefined {
    return getButtons().find((button) => button.id === id);
}

/**
 * Updates an existing button's properties.
 */
export function updateButton(id: number, updates: Partial<Omit<Button, 'id'>>): Button | undefined {
    const buttons = getButtons();
    const buttonIndex = buttons.findIndex((button) => button.id === id);
    if (buttonIndex === -1) {
        return undefined;
    }
    buttons[buttonIndex] = { ...buttons[buttonIndex], ...updates };
    setButtons(buttons);
    return buttons[buttonIndex];
}

/**
 * Deletes a button from the database by its ID.
 */
export function deleteButton(id: number): boolean {
    const buttons = getButtons();
    const buttonIndex = buttons.findIndex((button) => button.id === id);
    if (buttonIndex === -1) {
        return false;
    }
    buttons.splice(buttonIndex, 1);
    setButtons(buttons);
    return true;
}
