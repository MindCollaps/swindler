import type { StoreGameEventReq } from "./backend/request";

export type PartialRecord<K extends keyof any, T> = {
    [P in K]?: T;
};