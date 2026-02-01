import { Container, Graphics } from "pixi.js";
import type { PierState } from "./types";

export class PierIndicator extends Container {
  private readonly frame = new Graphics();
  private readonly fill = new Graphics();

  constructor(
    public readonly index: number,
    width = 64,
    height = 128,
  ) {
    super();

    this.frame.rect(0, 0, width, height).stroke({ width: 8, color: 0xffd000 });

    this.fill.rect(4, 4, width - 8, (height - 8) * 0.3).fill({ color: 0x56ffbf, alpha: 0 });

    this.addChild(this.fill, this.frame);
  }

  setState(state: PierState) {
    this.fill.alpha = state === "FILLED" ? 1 : 0;
  }
}
