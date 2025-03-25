import { Game } from "./game";

document.addEventListener("DOMContentLoaded", () => {
    const game = new Game("gameCanvas");
    
    const diceButton = document.getElementById("rollDice") as HTMLButtonElement;
    const diceResult = document.getElementById("diceResult") as HTMLParagraphElement;

    diceButton.addEventListener("click", () => {
        const roll = game.rollDice();
        diceResult.textContent = `Dice Roll: ${roll}`;
    });

    game.start();
});

