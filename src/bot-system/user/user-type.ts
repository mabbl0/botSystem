import { MapNameId } from "../../tools/collection/map";
import { UserVoice, UserVoiceApi, UserVoiceUpdateable } from "../communication/voice/user-voice";
import { VoiceChannel } from "../communication/voice/voice-type";
import { Attribute } from "../property/attribute";

// Role of an User
export interface Role {
    name: string
    id: string
    users: MapNameId<User>

    toString(): string;
}

// Manage User Role
interface UserRoleControllerApi {
    add(role: Role): void
    remove(role: Role): void
}

export class UserRoleController {
    private _userRoleControllerApi: UserRoleControllerApi
    private user: User
    private userRoles: MapNameId<Role>

    constructor(user: User, userRoleManagerApi: UserRoleControllerApi){
        this._userRoleControllerApi = userRoleManagerApi;
        this.user = user;
    }

    initUserRoles(allRoles: MapNameId<Role>){
        if(this.userRoles==undefined){
            this.userRoles = new MapNameId<Role>();
            allRoles.forEach(role => {
                if( role.users.has(this.user.id) ){
                    this.userRoles.set(role);
                }
            });
        }
    }

    add(role: Role){
        if(!role.users.has(this.user.id) && !this.userRoles.has(role.id)){
            this.userRoles.set(role);
            role.users.set(this.user);
            this._userRoleControllerApi.add(role);
        }
    }
    remove(role: Role){
        if(role.users.has(this.user.id) && this.userRoles.has(role.id)){
            this.userRoles.delete(role.id);
            role.users.delete(this.user.id);
            this._userRoleControllerApi.remove(role);
        }
    }
    has(role: Role): boolean{
        return this.userRoles.has(role.id);
    }
    hasByName(roleName: string): boolean {
        return this.userRoles.hasByName(roleName);
    }
} 


// user information deliver by the interface api
export interface UserApi {
    id: string
    bot: boolean
    username: string
    
    toString: () => string;
}

// secure version of UserApi with more information
export class User {
    private _userApi: UserApi
    private _admin: boolean // fill by UserManager
    roles: UserRoleController
    voice: UserVoice

    attr: Attribute
    
    constructor(userApi: UserApi, userRoleManagerApi: UserRoleControllerApi, userVoiceApi: UserVoiceApi, actualVoiceChannel: VoiceChannel){
        this._userApi = userApi;
        this.roles = new UserRoleController(this, userRoleManagerApi);
        this.voice = new UserVoiceUpdateable(userVoiceApi, actualVoiceChannel);
        this.attr = new Attribute();
    }
    
    get admin(){
        return this._admin;
    }
    set admin(newValue: boolean){
        if(this._admin==undefined){ // admin set onces
            this._admin = newValue;
        }
        else{
            console.error("Try to set new admin value for " + this._userApi.username);
        }
    }

    get id(){
        return this._userApi.id;
    }
    get name(){
        return this._userApi.username;
    }
    get bot(){
        return this._userApi.bot;
    }

    toString(): string{
        return this._userApi.toString();
    }
}
