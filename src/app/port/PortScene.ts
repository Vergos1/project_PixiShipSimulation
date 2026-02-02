import { Container, Graphics } from "pixi.js";
import { CONFIG } from "../config";
import { Pier } from "./Pier";
import { Port } from "./Port";
import { Ship } from "./Ship";
import type { ShipType } from "./types";
import { tweenTo } from "../utils/tween";

export class PortScene extends Container {
  private readonly sea = new Graphics();
  private readonly entranceWalls = new Graphics();
  private readonly shipsLayer = new Container();
  private readonly piersLayer = new Container();

  private readonly piers: Pier[] = [];
  private readonly port: Port;

  private readonly activeShips = new Map<string, Ship>();
  private spawnTimerId: ReturnType<typeof setInterval> | undefined;
  private readonly queueRed: Ship[] = [];
  private readonly queueGreen: Ship[] = [];
  private readonly queueGap = 12;
  private readonly queueStepX = CONFIG.shipW + this.queueGap;

  constructor() {
    super();
    this.drawBackground();
    this.createPiers();

    this.port = new Port(this.piers);

    this.addChild(this.sea, this.entranceWalls, this.piersLayer, this.shipsLayer);
  }

  start() {
    const tick = () => void this.spawnShip().catch(() => undefined);

    tick();
    this.spawnTimerId = globalThis.setInterval(tick, CONFIG.spawnEveryMs);
  }

  stop() {
    if (this.spawnTimerId !== undefined) {
      globalThis.clearInterval(this.spawnTimerId);
      this.spawnTimerId = undefined;
    }
  }

  private drawBackground() {
    this.sea.roundRect(0, 0, CONFIG.width, CONFIG.height, 0).fill({ color: 0x4d35ff });

    this.entranceWalls
      .moveTo(CONFIG.entranceX, 0)
      .lineTo(CONFIG.entranceX, CONFIG.entranceY - CONFIG.entranceGap / 2)
      .moveTo(CONFIG.entranceX, CONFIG.entranceY + CONFIG.entranceGap / 2)
      .lineTo(CONFIG.entranceX, CONFIG.height)
      .stroke({ width: 10, color: 0xffd000 });
  }

  private createPiers() {
    for (let i = 0; i < CONFIG.piersCount; i++) {
      const pier = new Pier(
        i,
        CONFIG.pierX,
        CONFIG.pierStartY + i * (CONFIG.pierH + CONFIG.pierGap),
        CONFIG.pierW,
        CONFIG.pierH,
      );
      this.piers.push(pier);
      this.piersLayer.addChild(pier);
    }
  }

  private randomShipType(): ShipType {
    return Math.random() < 0.5 ? "RED" : "GREEN";
  }

  private async spawnShip() {
    if (this.activeShips.size >= CONFIG.maxShips) return;

    const type = this.randomShipType();
    const ship = new Ship(type, CONFIG.shipW, CONFIG.shipH);
    ship.state = "SPAWNING";
    ship.position.set(CONFIG.width + 60, Math.random() * 400 + 100);
    this.shipsLayer.addChild(ship);
    this.activeShips.set(ship.id, ship);

    const provisionalIndex = type === "GREEN" ? this.queueGreen.length : this.queueRed.length;
    const laneY = type === "GREEN" ? CONFIG.queueGreenStartY : CONFIG.queueRedStartY;
    const approachX = CONFIG.queueX + provisionalIndex * this.queueStepX;

    ship.state = "APPROACHING";
    await tweenTo(ship, { x: approachX, y: laneY }, CONFIG.approachMs);

    this.onArriveToQueue(ship);
  }

  private onArriveToQueue(ship: Ship) {
    const pierIndex =
      ship.type === "GREEN" ? this.port.findPierForGreen() : this.port.findPierForRed();

    if (pierIndex === null || this.port.entranceBusy) {
      this.enqueue(ship);
      return;
    }

    void this.serveShip(ship, pierIndex).catch(() => undefined);
  }

  private enqueue(ship: Ship) {
    ship.state = "QUEUED";

    const q = ship.type === "GREEN" ? this.queueGreen : this.queueRed;
    if (!q.includes(ship)) q.push(ship);

    void this.layoutQueues(true).catch(() => undefined);
    this.pumpQueues();
  }

  private dequeue(ship: Ship) {
    const q = ship.type === "GREEN" ? this.queueGreen : this.queueRed;
    const idx = q.indexOf(ship);
    if (idx >= 0) q.splice(idx, 1);
  }

  private async layoutQueues(animated: boolean) {
    const move = async (ship: Ship, x: number, y: number) => {
      if (ship.state !== "QUEUED") return;
      if (!animated) {
        ship.position.set(x, y);
        return;
      }
      await tweenTo(ship, { x, y }, 250);
    };

    for (let i = 0; i < this.queueRed.length; i++) {
      const s = this.queueRed[i];
      const x = CONFIG.queueX + i * this.queueStepX;
      const y = CONFIG.queueRedStartY;
      await move(s, x, y);
    }

    for (let i = 0; i < this.queueGreen.length; i++) {
      const s = this.queueGreen[i];
      const x = CONFIG.queueX + i * this.queueStepX;
      const y = CONFIG.queueGreenStartY;
      await move(s, x, y);
    }
  }

  private pumpQueues() {
    if (this.port.entranceBusy) return;

    const greenHead = this.queueGreen[0];
    if (greenHead) {
      const idx = this.port.findPierForGreen();
      if (idx !== null) {
        this.dequeue(greenHead);
        void this.layoutQueues(true).catch(() => undefined);
        void this.serveShip(greenHead, idx).catch(() => undefined);
        return;
      }
    }

    const redHead = this.queueRed[0];
    if (redHead) {
      const idx = this.port.findPierForRed();
      if (idx !== null) {
        this.dequeue(redHead);
        void this.layoutQueues(true).catch(() => undefined);
        void this.serveShip(redHead, idx).catch(() => undefined);
      }
    }
  }

  private async serveShip(ship: Ship, pierIndex: number) {
    if (this.port.entranceBusy) {
      this.enqueue(ship);
      return;
    }

    const actualIndex =
      ship.type === "GREEN" ? this.port.findPierForGreen() : this.port.findPierForRed();
    if (actualIndex === null) {
      this.enqueue(ship);
      return;
    }

    ship.assignedPierIndex = pierIndex;
    this.port.reservePier(pierIndex);

    this.port.entranceBusy = true;
    ship.state = "ENTERING";

    const entranceHoldX = CONFIG.entranceX + 80;
    await tweenTo(ship, { x: entranceHoldX, y: CONFIG.entranceY }, CONFIG.enterMs);

    ship.state = "TO_PIER";
    const pier = this.piers[pierIndex];

    const dockGap = 10;
    const dockX = pier.x + CONFIG.pierW + dockGap;
    const dockY = pier.y + (CONFIG.pierH - CONFIG.shipH) / 2;
    await tweenTo(ship, { x: dockX, y: dockY }, CONFIG.dockMs);

    this.port.entranceBusy = false;
    this.pumpQueues();

    ship.state = "SERVICING";
    await new Promise((r) => setTimeout(r, CONFIG.serviceTimeMs));

    if (ship.type === "RED") {
      ship.setCargo(false);
      pier.setState("FILLED");
    } else {
      ship.setCargo(true);
      pier.setState("EMPTY");
    }

    await this.leavePort(ship, pierIndex, entranceHoldX);
  }

  private async leavePort(ship: Ship, pierIndex: number, entranceHoldX: number) {
    while (this.port.entranceBusy) {
      await new Promise((r) => setTimeout(r, 50));
    }
    this.port.entranceBusy = true;
    ship.state = "LEAVING_PIER";

    await tweenTo(ship, { x: entranceHoldX, y: CONFIG.entranceY }, CONFIG.leaveMs);

    this.port.releasePier(pierIndex);

    this.port.entranceBusy = false;
    this.pumpQueues();

    ship.state = "EXITING";
    await tweenTo(ship, { x: CONFIG.width + 200 }, CONFIG.exitMs);

    ship.state = "DONE";
    ship.destroy();
    this.activeShips.delete(ship.id);
  }
}
