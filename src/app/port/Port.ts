import type { ShipType } from "./types";
import { Pier } from "./Pier";

export class Port {
    public entranceBusy = false;

    private queueGreen: string[] = [];
    private queueRed: string[] = [];

    constructor(public piers: Pier[]) { }

    enqueue(shipId: string, type: ShipType) {
        if (type === "GREEN") this.queueGreen.push(shipId);
        else this.queueRed.push(shipId);
    }

    dequeue(shipId: string) {
        this.queueGreen = this.queueGreen.filter((id) => id !== shipId);
        this.queueRed = this.queueRed.filter((id) => id !== shipId);
    }

    findPierForGreen(): number | null {
        const idx = this.piers.findIndex((p) => !p.occupied && p.state === "FILLED");
        return idx >= 0 ? idx : null;
    }

    findPierForRed(): number | null {
        const idx = this.piers.findIndex((p) => !p.occupied && p.state === "EMPTY");
        return idx >= 0 ? idx : null;
    }

    canServe(type: ShipType) {
        return type === "GREEN" ? this.findPierForGreen() !== null : this.findPierForRed() !== null;
    }

    reservePier(pierIndex: number, shipType: "RED" | "GREEN") {
        this.piers[pierIndex].setOccupied(true, shipType);
    }

    releasePier(pierIndex: number) {
        this.piers[pierIndex].setOccupied(false, undefined);
    }
}
