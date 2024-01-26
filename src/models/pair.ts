import { User } from './user';

export class UserPairInfo {
    constructor(public readonly id: string, public readonly caller: User, public readonly callee: User) {}
}
