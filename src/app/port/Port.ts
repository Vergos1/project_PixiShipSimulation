import type { ShipType } from "./types";
import { Pier } from "./Pier";

export class Port {
  public entranceBusy = false;

  constructor(public readonly piers: Pier[]) {}

  findPierForGreen(): number | null {
    const idx = this.piers.findIndex((p) => !p.occupied && p.state === "FILLED");
    return idx === -1 ? null : idx;
  }

  findPierForRed(): number | null {
    const idx = this.piers.findIndex((p) => !p.occupied && p.state === "EMPTY");
    return idx === -1 ? null : idx;
  }

  canServe(type: ShipType) {
    return type === "GREEN" ? this.findPierForGreen() !== null : this.findPierForRed() !== null;
  }

  reservePier(index: number) {
    this.piers[index].setOccupied(true);
  }

  releasePier(index: number) {
    this.piers[index].setOccupied(false);
  }
}
