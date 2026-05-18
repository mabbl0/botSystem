import { UnitComponent } from "../component/unit-component";
import { User } from "./user";
import { UserConf } from "../bot-system-type";
import { MapNameId } from "../../tools/collection/map";
import { Role } from "./role";

export class UserManager extends UnitComponent {
    private conf: UserConf
    private users: MapNameId<User>
    private roles: MapNameId<Role>

    private _getMentionedUserApi: (userList: MapNameId<User>, str: string) => User[];
    private _getMentionedRoleApi: (roleList: MapNameId<Role>, str: string) => Role[];

    constructor(conf: UserConf){
        super("UserManager", "Manage BotSystem User");
        this.conf = conf;

        /** Declare Methods ***/
        this.mthInterface.addMethod("getUser", this.getUser.bind(this));
        this.mthInterface.addMethod("getMentionedUser", this.getMentionedUser.bind(this));
        this.mthInterface.addMethod("getMentionedRole", this.getMentionedRole.bind(this));
        this.mthInterface.addMethod("getAllMentionedUser", this.getAllMentionedUser.bind(this));
    }

    set getMentionedUserApi(fct: (userList: MapNameId<User>, str: string) => User[]) {
        if(this._getMentionedUserApi == undefined) { // only once
            this._getMentionedUserApi = fct;
        }
    }
    set getMentionedRoleApi(fct: (roleList: MapNameId<Role>, str: string) => Role[]) {
        if(this._getMentionedRoleApi == undefined) { // only once
            this._getMentionedRoleApi = fct;
        }
    }

    // Initiate and finish the Users list give by the interface Api 
    initUsers(users: MapNameId<User>){
        if(this.users == undefined){
            this.users = users;

            this.users.forEach(user => {
                user.admin = this.conf.adminIdList.includes(user.id);
            });
        }
    }

    // Initiate and finish the Roles list give by the interface Api
    initRoles(roles: MapNameId<Role>){
        if(this.roles == undefined){
            this.roles = roles;            
        }
    }

    // Add new user to the list
    addNewUser(user: User){
        if(this.users){
            // check if it is not already added to the list by the interfaceApi
            if( !this.users.has(user.id) ){
                this.users.set(user);
            }

            // then add admin boolean
            user.admin = this.conf.adminIdList.includes(user.id);
        }
    }

    /*** Methods ***/

    // get an user by name
    getUser(userName: string): User{
        return this.users?.getByName(userName);
    }

    // get the user list mentioned in a string
    getMentionedUser(str: string): User[] {
        if(this._getMentionedUserApi == undefined) {
            return [];
        }
        return this._getMentionedUserApi(this.users, str);
    }

    // get the role list mentioned in a string
    getMentionedRole(str: string): Role[] {
        if(this._getMentionedRoleApi == undefined) {
            return [];
        }
        return this._getMentionedRoleApi(this.roles, str);
    }

    // get all the users mentioned in a string, even the user mentioned by a role
    getAllMentionedUser(str: string): User[] {
        let userMentioned = this.getMentionedUser(str);
        this.getMentionedRole(str)?.forEach( roleM => 
            roleM.users?.forEach( userR => {
                if(!userMentioned.includes(userR)) {
                    userMentioned.push(userR);
                }
            })
        );
        this.logDebug(`${userMentioned.length} users mentioned`);
        return userMentioned;
    }
}