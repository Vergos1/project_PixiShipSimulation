import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { PierState } from "./types";

export class Pier extends Container {
  public readonly index: number;

  public state: PierState = "EMPTY";
  public occupied = false;
  public occupiedByShipType: "RED" | "GREEN" | null = null;

  private readonly box = new Graphics();
  private readonly labelText: Text;

  constructor(
    index: number,
    x: number,
    y: number,
    private readonly w: number,
    private readonly h: number,
  ) {
    super();
    this.index = index;

    this.position.set(x, y);

    this.sortableChildren = true;

    this.addChild(this.box);

    this.labelText = new Text({
      text: `Pier ${index + 1}`,
      style: new TextStyle({ fill: 0xffffff, fontSize: 12, fontWeight: "600" }),
    });
    this.labelText.position.set(8, -18);
    this.labelText.zIndex = 1000;
    this.addChild(this.labelText);

    this.render();
  }

  setState(state: PierState) {
    this.state = state;
    this.render();
  }

  setOccupied(value: boolean, shipType?: "RED" | "GREEN") {
    this.occupied = value;
    this.occupiedByShipType = value && shipType ? shipType : null;
    this.render();
  }

  private render() {
    this.box.clear();

    this.box.roundRect(2, 2, this.w, this.h, 10).fill({ color: 0x000000, alpha: 0.15 });

    this.box.roundRect(0, 0, this.w, this.h, 10);

    if (this.state === "FILLED") {
      this.box.fill({ color: 0xffc857, alpha: 0.92 });
      this.box
        .roundRect(2, 2, this.w - 4, (this.h - 4) * 0.3, 8)
        .fill({ color: 0xffe088, alpha: 0.5 });
    }

    let strokeColor: number;
    if (this.occupied && this.occupiedByShipType) {
      strokeColor = this.occupiedByShipType === "RED" ? 0xff2d2d : 0x33ff6b;
    } else {
      strokeColor = 0x56ffbf;
    }

    this.box.roundRect(0, 0, this.w, this.h, 10);
    this.box.stroke({
      width: this.occupied ? 5 : 4,
      color: strokeColor,
      alpha: 1,
    });
  }
}
