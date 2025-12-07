export enum ReportReason {
    INAPPROPRIATE = 0,
    SPAM = 1,
    OFFENSIVE = 2,
    INCORRECT = 3,
    OTHER = 4,
}

export interface FlagWordRequest {
    wordId: number;
    reason: ReportReason;
    message?: string;
}
