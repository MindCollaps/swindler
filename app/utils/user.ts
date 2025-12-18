export interface UserIdentity {
    id: number;
    fakeUser: boolean;
}

export function isSameUser(u1: UserIdentity | undefined | null, u2: UserIdentity | undefined | null): boolean {
    if (!u1 || !u2) return false;
    
    if (u1.fakeUser !== u2.fakeUser) return false;
    return u1.id === u2.id;
}
