import { Application, Container, Graphics } from "pixi.js";
import { CONFIG } from "../config";
import { tweenTo } from "../utils/tween";
import type { ShipType } from "./types";
import { Pier } from "./Pier";
import { Ship } from "./Ship";
import { Port } from "./Port";
import { PierIndicator } from "./PierIndicator";

export class PortScene extends Container {
  private readonly app: Application;

  private readonly sea = new Graphics();
  private readonly portArea = new Graphics();
  private readonly entranceWalls = new Graphics();

  private readonly shipsLayer = new Container();
  private readonly piersLayer = new Container();
  private readonly uiLayer = new Container();

  private readonly piers: Pier[] = [];
  private readonly port: Port;

  private readonly activeShips = new Map<string, Ship>();

  private readonly pierIndicatorsLayer = new Container();
  private readonly pierIndicators: PierIndicator[] = [];

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
    this.createPierIndicators();
    this.addChild(this.pierIndicatorsLayer);

    this.port = new Port(this.piers);

    this.addChild(this.shipsLayer);
    this.addChild(this.piersLayer);
    this.addChild(this.uiLayer);

    this.spawnShip();
    globalThis.setInterval(() => this.spawnShip(), CONFIG.spawnEveryMs);

    this.app.ticker.add(() => {
      this.tryDispatchFromQueues();
      this.relayoutQueues();
    });
  }

  private syncPierIndicator(index: number) {
    const pier = this.piers[index];
    const indicator = this.pierIndicators[index];

    indicator.setState(pier.state);
  }

  private createPierIndicators() {
    const startX = 18; // зліва
    const startY = 90; // зверху
    const gap = 26; // відстань між квадратами

    this.piers.forEach((_, index) => {
      const indicator = new PierIndicator(index);

      indicator.position.set(startX, startY + index * (80 + gap));

      this.pierIndicators.push(indicator);
      this.pierIndicatorsLayer.addChild(indicator);
    });
  }

  private drawBackground() {
    const { width, height, portWidth, portHeight, entranceX, entranceY, entranceGap } = CONFIG;

    this.sea.clear();
    this.sea.roundRect(0, 0, width, height, 0).fill({ color: 0x4d35ff });

    this.portArea.clear();
    this.portArea
      .rect(0, 25, portWidth, (height + portHeight) / 100)
      .fill({ color: 0xffd000, alpha: 0.95 });
    this.portArea
      .rect(0, 50, portWidth, (portHeight + portHeight) / 100)
      .fill({ color: 0xffd000, alpha: 0.95 });

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
      //TODO: add to queue
      if (!this.greenQueueIds.includes(ship.id)) this.greenQueueIds.push(ship.id);
    } else {
      //TODO: add to queue
      if (!this.redQueueIds.includes(ship.id)) this.redQueueIds.push(ship.id);
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

    await this.serviceShip(ship, pier.index);
  }

  private async serviceShip(ship: Ship, pierIndex: number) {
    await new Promise<void>((resolve) => setTimeout(resolve, CONFIG.serviceTimeMs));

    const pier = this.piers[pierIndex];

    if (ship.type === "RED") {
      ship.setCargo(false);
      pier.setState("FILLED");
      this.syncPierIndicator(pierIndex);
    } else {
      ship.setCargo(true);
      pier.setState("EMPTY");
      this.syncPierIndicator(pierIndex);
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
