import { Game } from "./game";

document.addEventListener("DOMContentLoaded", () => {
    const game = new Game("gameCanvas");

    game.start();
});

