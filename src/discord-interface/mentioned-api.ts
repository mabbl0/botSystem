import { ChannelCore } from "../bot-system/communication/channel";
import { MentionedAPI } from "../bot-system/interface-api/interface-api-type";
import { Role } from "../bot-system/user/role";
import { User } from "../bot-system/user/user";
import { MapName, MapNameId } from "../tools/collection/map";


export class MentionedDiscord implements MentionedAPI {
    /**
     * Detect the mentioned users in a string
     * @param userList users list to search
     * @param str string to detect the mentioned user
     * @returns the mentioned users
     */
    getMentionedUser(userList: MapNameId<User>, str: string): User[] {
        if(str.includes('@everyone')) { // return every user
            return userList.toArr();
        }
        
        let usersMentioned: User[] = [];
        str.match(/(?<=<@)\d+(?=>)/g)?.forEach( idM => {
            let user = userList.get(idM);
            if(user!=undefined) {
                usersMentioned.push(user);
            }
        });
        return usersMentioned;
    }

    /**
     * Detect the mentioned roles in a string
     * @param roleList roles list to search
     * @param str string to detect the mentioned role
     * @returns the mentioned roles
     */
    getMentionedRole(roleList: MapNameId<Role>, str: string): Role[] {
        let rolesMentioned: Role[] = [];
        str.match(/(?<=<@&)\d+(?=>)/g)?.forEach( idM => {
            let role = roleList.get(idM);
            if(role!=undefined) {
                rolesMentioned.push(role);
            }
        });
        return rolesMentioned;
    }

    /**
     * Detect the mentioned channel in a string
     * @param channelList channel list to search
     * @param str string to detect the mentioned role
     * @returns the mentioned channel
     */
    getMentionedChannel(channelList: MapName<ChannelCore>, str: string): ChannelCore[] {
        let ChannelMentioned: ChannelCore[] = [];
        str.match(/(?<=<#)\d+(?=>)/g)?.forEach( idM => {
            let channel = channelList.get(idM);
            if(channel!=undefined) {
                ChannelMentioned.push(channel);
            }
        });
        return ChannelMentioned;
    }
}