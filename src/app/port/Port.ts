import type { ShipType } from "./types";
import { Pier } from "./Pier";

export class Port {
  public entranceBusy = false;

  constructor(public readonly piers: Pier[]) {}

  findPierForGreen(): number | null {
    return this.piers.findIndex((p) => !p.occupied && p.state === "FILLED");
  }

  findPierForRed(): number | null {
    return this.piers.findIndex((p) => !p.occupied && p.state === "EMPTY");
  }

  canServe(type: ShipType) {
    return type === "GREEN" ? this.findPierForGreen() !== -1 : this.findPierForRed() !== -1;
  }

  reservePier(index: number | null) {
    if (index === null) return;
    this.piers[index].setOccupied(true);
  }

  releasePier(index: number | null) {
    if (index === null) return;
    this.piers[index].setOccupied(false);
  }
}
