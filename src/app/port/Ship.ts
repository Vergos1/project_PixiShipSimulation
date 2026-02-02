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
  private cargoProgress = 0;

  constructor(
    type: ShipType,
    private readonly w: number,
    private readonly h: number,
  ) {
    super();
    this.type = type;
    this.hasCargo = type === "RED";
    this.cargoProgress = this.hasCargo ? 1 : 0;
    this.addChild(this.body);
    this.render();
  }

  setCargo(v: boolean) {
    this.hasCargo = v;
    this.cargoProgress = v ? 1 : 0;
    this.render();
  }

  setCargoProgress(progress01: number) {
    this.cargoProgress = Math.max(0, Math.min(1, progress01));
    this.hasCargo = this.cargoProgress > 0.999;
    this.render();
  }

  private render() {
    const color = this.type === "RED" ? 0xff2d2d : 0x33ff6b;
    this.body.clear();
    this.body.roundRect(0, 0, this.w, this.h, 8).stroke({ width: 4, color });

    if (this.cargoProgress >= 0.999) {
      this.body.roundRect(0, 0, this.w, this.h, 8).fill({ color, alpha: 0.95 });
      return;
    }

    if (this.cargoProgress <= 0.001) return;

    const innerW = this.w - 8;
    const innerH = this.h - 8;
    const fillW = innerW * this.cargoProgress;
    this.body.rect(4, 4, fillW, innerH).fill({ color, alpha: 0.95 });
  }
}
