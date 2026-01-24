import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { CONFIG } from "../config";
import { HUD } from "../ui/HUD";
import { tweenTo } from "../utils/tween";
import type { ShipType } from "./types";
import { Pier } from "./Pier";
import { Ship } from "./Ship";
import { Port } from "./Port";

export class PortScene extends Container {
    private app: Application;

    private sea = new Graphics();
    private portArea = new Graphics();
    private entranceWalls = new Graphics();

    private shipsLayer = new Container();
    private piersLayer = new Container();
    private uiLayer = new Container();

    private piers: Pier[] = [];
    private port: Port;

    private hud: HUD;

    private activeShips = new Map<string, Ship>();

    private greenQueueIds: string[] = [];
    private redQueueIds: string[] = [];

    constructor(app: Application) {
        super();
        this.app = app;

        this.drawBackground();
        this.addChild(this.sea, this.portArea, this.entranceWalls);

        CONFIG.piers.forEach((p, i) => {
            const pier = new Pier(i, p.x, p.y, CONFIG.pierW, CONFIG.pierH);
            pier.setState("EMPTY");
            this.piers.push(pier);
            this.piersLayer.addChild(pier);
        });

        this.port = new Port(this.piers);

        this.addChild(this.shipsLayer);
        this.addChild(this.piersLayer);
        this.addChild(this.uiLayer);

        this.hud = new HUD();

        this.spawnShip();
        window.setInterval(() => this.spawnShip(), CONFIG.spawnEveryMs);

        this.app.ticker.add(() => {
            this.tryDispatchFromQueues();
            this.relayoutQueues();
        });
    }

    private drawBackground() {
        const { width, height, portWidth, entranceX, entranceY, entranceGap } = CONFIG;

        this.sea.clear();
        this.sea.roundRect(0, 0, width, height, 0).fill({ color: 0x1a3a8f, alpha: 1 });
        this.sea.roundRect(0, 0, width, height * 0.4, 0).fill({ color: 0x2b4bff, alpha: 0.6 });

        this.portArea.clear();
        this.portArea.rect(4, 4, portWidth, height).fill({ color: 0x000000, alpha: 0.25 });
        this.portArea.rect(0, 0, portWidth, height).fill({ color: 0xffd000, alpha: 0.95 });

        this.entranceWalls.clear();

        this.entranceWalls.moveTo(entranceX + 2, 0);
        this.entranceWalls.lineTo(entranceX + 2, entranceY - entranceGap / 2);
        this.entranceWalls.moveTo(entranceX + 2, entranceY + entranceGap / 2);
        this.entranceWalls.lineTo(entranceX + 2, height);
        this.entranceWalls.stroke({ width: 8, color: 0x000000, alpha: 0.3 });

        this.entranceWalls.moveTo(entranceX, 0);
        this.entranceWalls.lineTo(entranceX, entranceY - entranceGap / 2);
        this.entranceWalls.moveTo(entranceX, entranceY + entranceGap / 2);
        this.entranceWalls.lineTo(entranceX, height);
        this.entranceWalls.stroke({ width: 10, color: 0xffd000, alpha: 1 });

        const hintBg = new Graphics();
        hintBg.roundRect(entranceX + 8, entranceY - 22, 90, 24, 6).fill({ color: 0x000000, alpha: 0.5 });
        this.uiLayer.addChild(hintBg);

        const hint = new Text({
            text: "ENTRANCE",
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: "700",
                dropShadow: { alpha: 0.8, distance: 2, blur: 3, color: 0x000000, angle: Math.PI / 4 },
            }),
        });
        hint.position.set(entranceX + 12, entranceY - 18);
        this.uiLayer.addChild(hint);
    }


    private randomShipType(): ShipType {
        return Math.random() < 0.5 ? "RED" : "GREEN";
    }

    private async spawnShip() {
        if (this.activeShips.size >= CONFIG.maxShips) {
            return;
        }

        const type = this.randomShipType();

        const ship = new Ship(type, CONFIG.shipW, CONFIG.shipH);
        ship.position.set(CONFIG.width + 60, 120 + Math.random() * 420);
        ship.setState("APPROACHING");

        this.activeShips.set(ship.id, ship);
        this.shipsLayer.addChild(ship);

        this.hud.log(`Spawned ${HUD.shipLabel(type)} (${ship.id})`);

        const targetY = type === "RED" ? CONFIG.queueRedStartY : CONFIG.queueGreenStartY;
        await tweenTo(ship, { x: CONFIG.queueX + 140, y: targetY }, CONFIG.approachMs);

        this.handleArrival(ship);
    }

    private handleArrival(ship: Ship) {
        if (!this.port.canServe(ship.type)) {
            this.enqueueShip(ship);
            return;
        }

        this.sendShipToEntrance(ship);
    }

    private enqueueShip(ship: Ship) {
        ship.setState("QUEUED");
        this.port.enqueue(ship.id, ship.type);

        if (ship.type === "GREEN") {
            if (!this.greenQueueIds.includes(ship.id)) this.greenQueueIds.push(ship.id);
            this.hud.log(`GREEN queued (no cargo on free piers) → ${ship.id}`);
        } else {
            if (!this.redQueueIds.includes(ship.id)) this.redQueueIds.push(ship.id);
            this.hud.log(`RED queued (no empty free piers) → ${ship.id}`);
        }
    }

    private async sendShipToEntrance(ship: Ship) {
        const pierIndex =
            ship.type === "GREEN" ? this.port.findPierForGreen() : this.port.findPierForRed();

        if (pierIndex === null) {
            this.enqueueShip(ship);
            return;
        }

        ship.assignedPierIndex = pierIndex;
        this.port.reservePier(pierIndex, ship.type);

        await tweenTo(ship, { x: CONFIG.entranceX + 70, y: CONFIG.entranceY }, 650);

        ship.setState("ENTERING");
        await this.passEntranceAndDock(ship);
    }

    private async passEntranceAndDock(ship: Ship) {
        if (this.port.entranceBusy) return;

        this.port.entranceBusy = true;

        await tweenTo(ship, { x: CONFIG.entranceX - 40, y: CONFIG.entranceY }, CONFIG.enterMs);

        this.port.entranceBusy = false;

        const pier = this.piers[ship.assignedPierIndex!];
        ship.setState("TO_PIER");

        const dockPoint = {
            x: pier.x + (CONFIG.pierW - CONFIG.shipW) / 2,
            y: pier.y + (CONFIG.pierH - CONFIG.shipH) / 2,
        };

        await tweenTo(ship, dockPoint, CONFIG.dockMs);

        ship.setState("SERVICING");
        this.hud.log(`Docked at Pier ${pier.index + 1} → ${ship.id}`);

        await this.serviceShip(ship, pier.index);
    }

    private async serviceShip(ship: Ship, pierIndex: number) {
        await new Promise<void>((resolve) => setTimeout(resolve, CONFIG.serviceTimeMs));

        const pier = this.piers[pierIndex];

        if (ship.type === "RED") {
            ship.setCargo(false);
            pier.setState("FILLED");
            this.hud.log(`RED unloaded → Pier ${pierIndex + 1} FILLED`);
        } else {
            ship.setCargo(true);
            pier.setState("EMPTY");
            this.hud.log(`GREEN loaded → Pier ${pierIndex + 1} EMPTY`);
        }

        this.port.releasePier(pierIndex);
        await this.leavePort(ship);
    }

    private async leavePort(ship: Ship) {
        ship.setState("EXITING");

        await tweenTo(ship, { x: CONFIG.entranceX - 40, y: CONFIG.entranceY }, CONFIG.leaveMs);

        while (this.port.entranceBusy) {
            await new Promise((r) => setTimeout(r, 100));
        }
        this.port.entranceBusy = true;

        await tweenTo(ship, { x: CONFIG.entranceX + 90, y: CONFIG.entranceY }, CONFIG.exitMs);

        this.port.entranceBusy = false;

        await tweenTo(ship, { x: CONFIG.width + 160 }, 1400);

        ship.setState("DONE");
        this.hud.log(`Departed → ${ship.id}`);

        this.cleanupShip(ship);
    }

    private cleanupShip(ship: Ship) {
        this.port.dequeue(ship.id);
        this.greenQueueIds = this.greenQueueIds.filter((id) => id !== ship.id);
        this.redQueueIds = this.redQueueIds.filter((id) => id !== ship.id);

        this.activeShips.delete(ship.id);
        ship.destroy({ children: true });
    }

    private tryDispatchFromQueues() {
        if (this.port.entranceBusy) return;

        for (const id of this.greenQueueIds) {
            const ship = this.activeShips.get(id);
            if (!ship) continue;

            if (this.port.canServe("GREEN")) {
                this.port.dequeue(id);
                this.greenQueueIds = this.greenQueueIds.filter((x) => x !== id);
                this.sendShipToEntrance(ship);
                return;
            }
        }

        for (const id of this.redQueueIds) {
            const ship = this.activeShips.get(id);
            if (!ship) continue;

            if (this.port.canServe("RED")) {
                this.port.dequeue(id);
                this.redQueueIds = this.redQueueIds.filter((x) => x !== id);
                this.sendShipToEntrance(ship);
                return;
            }
        }
    }

    private relayoutQueues() {
        this.greenQueueIds.forEach((id, idx) => {
            const s = this.activeShips.get(id);
            if (!s) return;

            const targetX = CONFIG.queueX + idx * 140;
            const targetY = CONFIG.queueGreenStartY;

            s.x += (targetX - s.x) * 0.08;
            s.y += (targetY - s.y) * 0.08;
        });


        this.redQueueIds.forEach((id, idx) => {
            const s = this.activeShips.get(id);
            if (!s) return;

            const targetX = CONFIG.queueX + idx * 140;
            const targetY = CONFIG.queueRedStartY;

            s.x += (targetX - s.x) * 0.08;
            s.y += (targetY - s.y) * 0.08;
        });
    }

}
