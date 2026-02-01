import { Container, Graphics } from "pixi.js";
import type { PierState } from "./types";

export class Pier extends Container {
  public state: PierState = "EMPTY";
  public occupied = false;

  private readonly frame = new Graphics();
  private readonly fill = new Graphics();

  constructor(
    public readonly index: number,
    x: number,
    y: number,
    private readonly w: number,
    private readonly h: number,
  ) {
    super();
    this.position.set(x, y);

    this.addChild(this.fill, this.frame);
    this.render();
  }

  setState(state: PierState) {
    this.state = state;
    this.render();
  }

  setOccupied(value: boolean) {
    this.occupied = value;
    this.render();
  }

  private render() {
    this.frame.clear();
    this.fill.clear();

    const strokeColor = this.occupied ? 0x33ff6b : 0xffd000;

    this.frame.rect(0, 0, this.w, this.h).stroke({ width: 8, color: strokeColor });

    this.fill.rect(4, 4, this.w - 8, this.h - 8).fill({ color: 0xffc857, alpha: 0.95 });
    this.fill.alpha = this.state === "FILLED" ? 1 : 0;
  }
}
