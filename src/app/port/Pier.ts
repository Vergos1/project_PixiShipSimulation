import { Container, Graphics } from "pixi.js";
import type { PierState } from "./types";

export class Pier extends Container {
  public state: PierState = "EMPTY";
  public occupied = false;

  private readonly frame = new Graphics();
  private readonly fill = new Graphics();
  private fillProgress = 0;

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
    this.fillProgress = state === "FILLED" ? 1 : 0;
    this.render();
  }

  setFillProgress(progress01: number) {
    this.fillProgress = Math.max(0, Math.min(1, progress01));
    this.render();
  }

  setOccupied(value: boolean) {
    this.occupied = value;
    this.render();
  }

  private render() {
    this.frame.clear();
    this.fill.clear();

    this.frame.rect(0, 0, this.w, this.h).stroke({ width: 8, color: 0xffd800 });

    const innerW = this.w - 8;
    const innerH = this.h - 8;
    const fillH = innerH * this.fillProgress;
    const fillY = 4 + (innerH - fillH);

    this.fill.rect(4, fillY, innerW, fillH).fill({ color: 0xffd800 });
    this.fill.alpha = this.fillProgress > 0 ? 1 : 0;
  }
}
