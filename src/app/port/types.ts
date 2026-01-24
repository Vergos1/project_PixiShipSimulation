export type ShipType = "RED" | "GREEN";

export type ShipState =
    | "SPAWNING"
    | "APPROACHING"
    | "QUEUED"
    | "ENTERING"
    | "TO_PIER"
    | "SERVICING"
    | "LEAVING_PIER"
    | "EXITING"
    | "DONE";

export type PierState = "EMPTY" | "FILLED";
