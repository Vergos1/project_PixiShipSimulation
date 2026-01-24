import type { ShipType } from "../port/types";

export class HUD {
    private lines: string[] = [];
    private maxLines = 12;

    log(message: string) {
        const t = new Date();
        const hh = String(t.getHours()).padStart(2, "0");
        const mm = String(t.getMinutes()).padStart(2, "0");
        const ss = String(t.getSeconds()).padStart(2, "0");

        this.lines.unshift(`[${hh}:${mm}:${ss}] ${message}`);
        if (this.lines.length > this.maxLines) this.lines.pop();

        console.log(this.lines.join("\n"));
    }

    static shipLabel(type: ShipType) {
        return type === "RED" ? "RED (unload)" : "GREEN (load)";
    }
}
