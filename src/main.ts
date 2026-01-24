import "./styles/index.css";
import { GameApp } from "./app/index";

(async () => {
    const game = new GameApp();
    await game.init();
    game.mount("#game-container");
})();
