import { Game } from "./game";

document.addEventListener("DOMContentLoaded", () => {
    // Create input for game selection
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter game ID (number)";
    input.style.marginRight = "8px";
    input.id = "game-id-input";

    const button = document.createElement("button");
    button.textContent = "Start Game";
    button.id = "start-game-btn";

    document.body.appendChild(input);
    document.body.appendChild(button);

    let currentGame: Game | null = null;

    button.addEventListener("click", () => {
        const value = input.value.trim();
        let gameId: bigint = 1n;
        if (value && !isNaN(Number(value))) {
            gameId = BigInt(value);
        }
        // Remove any existing game UI
        if (currentGame) {
            // Remove all elements after the input/button
            while (document.body.children.length > 2) {
                document.body.removeChild(document.body.lastChild!);
            }
        }
        // Hide input and button after starting game
        input.style.display = "none";
        button.style.display = "none";
        currentGame = new Game("gameCanvas", gameId);
        currentGame.start();
    });

    // Optionally, auto-start with default game
    // currentGame = new Game("gameCanvas", 1n);
    // currentGame.start();
});
