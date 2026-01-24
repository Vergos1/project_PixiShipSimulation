import { Application } from "pixi.js";
import { CONFIG } from "./config";
import { PortScene } from "./port/PortScene";
import { tickTweens } from "./utils/tween";

export class GameApp {
    private app: Application;
    private scene!: PortScene;

    constructor() {
        this.app = new Application();
    }

    async init() {
        await this.app.init({
            width: CONFIG.width,
            height: CONFIG.height,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        this.scene = new PortScene(this.app);
        this.app.stage.addChild(this.scene);

        this.app.ticker.add(() => {
            tickTweens(performance.now());
        });
    }

    mount(selector: string) {
        const root = document.querySelector(selector);
        if (!root) throw new Error(`Root not found: ${selector}`);

        root.appendChild(this.app.canvas);
    }
}
