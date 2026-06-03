import { MapNameId } from "../../tools/collection/map";
import { User } from "./user";


// Role of an User
export interface Role {
    name: string
    id: string
    users: MapNameId<User>
    
    toString(): string;
}

/** @internal */
export interface UserRoleControlApiFunction {
    addRole(userRoleControllerApi: any, role: Role): void
    removeRole(userRoleControllerApi: any, role: Role): void
}

export class UserRoleControl {
    #userRoleControllerApi: any
    #userRoleControlApiFunction: UserRoleControlApiFunction
    #user: User
    #userRoles: MapNameId<Role>

    /** @internal */
    constructor(user: User, userRoleControllerApi: any, userRoleControlApiFunction: UserRoleControlApiFunction){
        this.#user = user;
        this.#userRoleControllerApi = userRoleControllerApi;
        this.#userRoleControlApiFunction = userRoleControlApiFunction;
    }

    /** @internal */
    initUserRoles(allRoles: MapNameId<Role>){
        if(this.#userRoles==undefined){
            this.#userRoles = new MapNameId<Role>();
            allRoles.forEach(role => {
                if( role.users.has(this.#user.id) ){
                    this.#userRoles.set(role);
                }
            });
        }
    }

    add(role: Role){
        if(!role.users.has(this.#user.id) && !this.#userRoles.has(role.id)){
            this.#userRoles.set(role);
            role.users.set(this.#user);
            this.#userRoleControlApiFunction.addRole(this.#userRoleControllerApi, role);
        }
    }
    remove(role: Role){
        if(role.users.has(this.#user.id) && this.#userRoles.has(role.id)){
            this.#userRoles.delete(role.id);
            role.users.delete(this.#user.id);
            this.#userRoleControlApiFunction.removeRole(this.#userRoleControllerApi, role);
        }
    }
    has(role: Role): boolean{
        return this.#userRoles.has(role.id);
    }
    hasByName(roleName: string): boolean {
        return this.#userRoles.hasByName(roleName);
    }
}

