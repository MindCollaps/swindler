export interface WordlistActor {
    userId: number;
    admin: boolean;
}

export interface WordlistMeta {
    fromUserId: number | null;
    default: boolean;
    public: boolean;
    shared?: boolean;
    sharedWithUser?: boolean;
}

export type WordlistDecisionReason =
    'forbidden' |
    'default_requires_admin' |
    'in_use';

export interface WordlistDecision {
    allowed: boolean;
    reason?: WordlistDecisionReason;
}

function isOwner(meta: WordlistMeta, actor: WordlistActor): boolean {
    return meta.fromUserId === actor.userId;
}

function isShared(meta: WordlistMeta): boolean {
    return Boolean(meta.shared && meta.sharedWithUser);
}

export function canReadWordlist(meta: WordlistMeta, actor: WordlistActor): WordlistDecision {
    const allowed = actor.admin || meta.public || meta.default || isOwner(meta, actor) || isShared(meta);
    return allowed ? { allowed: true } : { allowed: false, reason: 'forbidden' };
}

export function canEditWordlist(meta: WordlistMeta, actor: WordlistActor): WordlistDecision {
    if (meta.default && !actor.admin) {
        return { allowed: false, reason: 'default_requires_admin' };
    }

    if (!isOwner(meta, actor) && !actor.admin) {
        return { allowed: false, reason: 'forbidden' };
    }

    return { allowed: true };
}

export function canDeleteWordlist(meta: WordlistMeta, actor: WordlistActor, inUse: boolean): WordlistDecision {
    const editDecision = canEditWordlist(meta, actor);
    if (!editDecision.allowed) {
        return editDecision;
    }

    if (inUse) {
        return { allowed: false, reason: 'in_use' };
    }

    return { allowed: true };
}
