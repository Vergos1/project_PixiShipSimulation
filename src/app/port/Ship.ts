import { Container, Graphics } from "pixi.js";
import type { ShipType, ShipState } from "./types";
import { nextId } from "../utils/id";

export class Ship extends Container {
  public readonly id = nextId("ship");
  public readonly type: ShipType;

  public state: ShipState = "SPAWNING";
  public hasCargo: boolean;
  public assignedPierIndex: number | null = null;

  private readonly body = new Graphics();

  constructor(
    type: ShipType,
    private readonly w: number,
    private readonly h: number,
  ) {
    super();
    this.type = type;
    this.hasCargo = type === "RED";
    this.addChild(this.body);
    this.render();
  }

  setCargo(v: boolean) {
    this.hasCargo = v;
    this.render();
  }

  private render() {
    const color = this.type === "RED" ? 0xff2d2d : 0x33ff6b;
    this.body.clear();
    this.body.roundRect(0, 0, this.w, this.h, 8);

    if (this.hasCargo) {
      this.body.fill({ color });
    } else {
      this.body.stroke({ width: 4, color });
    }
  }
}
