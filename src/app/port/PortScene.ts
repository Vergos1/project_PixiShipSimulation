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

    const ship = new Ship(this.randomShipType(), CONFIG.shipW, CONFIG.shipH);
    ship.position.set(CONFIG.width + 60, Math.random() * 400 + 100);
    this.shipsLayer.addChild(ship);
    this.activeShips.set(ship.id, ship);

    await tweenTo(ship, { x: CONFIG.queueX }, CONFIG.approachMs);

    this.tryServe(ship);
  }

  private async tryServe(ship: Ship) {
    const pierIndex =
      ship.type === "GREEN" ? this.port.findPierForGreen() : this.port.findPierForRed();

    if (pierIndex === -1) return;

    ship.assignedPierIndex = pierIndex;
    this.port.reservePier(pierIndex);

    await tweenTo(ship, { x: CONFIG.entranceX }, CONFIG.enterMs);

    const pier = this.piers[pierIndex!];
    await tweenTo(
      ship,
      {
        x: pier.x + pier.width + 10,
        y: pier.y,
      },
      CONFIG.dockMs,
    );

    await new Promise((r) => setTimeout(r, CONFIG.serviceTimeMs));

    if (ship.type === "RED") {
      ship.setCargo(false);
      pier.setState("FILLED");
    } else {
      ship.setCargo(true);
      pier.setState("EMPTY");
    }

    this.port.releasePier(pierIndex);
  }
}
