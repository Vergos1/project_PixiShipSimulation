import { Container, Graphics } from "pixi.js";
import type { ShipState, ShipType } from "./types";
import { nextId } from "../utils/id";

export class Ship extends Container {
    public readonly id: string;
    public readonly type: ShipType;

    public state: ShipState = "SPAWNING";
    public hasCargo: boolean;
    public assignedPierIndex: number | null = null;

    private body = new Graphics();

    constructor(type: ShipType, private w: number, private h: number) {
        super();

        this.id = nextId("ship");
        this.type = type;

        this.hasCargo = type === "RED";

        this.addChild(this.body);

        this.render();
    }

    setState(state: ShipState) {
        this.state = state;
        this.render();
    }

    setCargo(value: boolean) {
        this.hasCargo = value;
        this.render();
    }

    private render() {
        const baseColor = this.type === "RED" ? 0xff2d2d : 0x33ff6b;
        const lightColor = this.type === "RED" ? 0xff5555 : 0x5aff88;

        this.body.clear();

        this.body
            .roundRect(2, 2, this.w, this.h, 10)
            .fill({ color: 0x000000, alpha: 0.2 });

        this.body.roundRect(0, 0, this.w, this.h, 10);

        if (this.hasCargo) {
            this.body.fill({ color: baseColor, alpha: 0.95 });
            this.body
                .roundRect(2, 2, this.w - 4, (this.h - 4) * 0.4, 8)
                .fill({ color: lightColor, alpha: 0.4 });
        } else {
            this.body.stroke({ width: 4, color: baseColor, alpha: 0.9 });
        }

        this.body.stroke({ width: 3, color: baseColor, alpha: 1 });

        this.body
            .roundRect(this.w * 0.62, 6, this.w * 0.3, this.h - 12, 8)
            .fill({ color: this.hasCargo ? 0xffffff : 0x000000, alpha: this.hasCargo ? 0.25 : 0.15 })
            .stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
    }
}
