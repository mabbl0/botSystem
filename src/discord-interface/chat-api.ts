import Discord from "discord.js";
import { ChatAPI } from "../bot-system/interface-api/interface-api-type";
import { MapName, MapNameId } from "../tools/collection/map";
import { Role, User, UserApi } from "../bot-system/user/user-type";
import { DiscordInterface } from "./discord-interface-api";
import { VoiceChannel } from "../bot-system/communication/voice/voice-type";
import { ChannelCore } from "../bot-system/communication/channel";

export class ChatDiscord implements ChatAPI {
    private discordApi: DiscordInterface
    users: MapNameId<User>
    roles: MapNameId<Role>
    channels: MapName<ChannelCore>
    voiceChannels: MapName<VoiceChannel>

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;
    }

    /*** Method to get chat object ***/
    // return the channel list 
    getChannels(): MapName<ChannelCore> {
        this.channels = new MapName<ChannelCore>();
        if (this.discordApi.guild) {
            this.discordApi.guild.channels.cache.forEach(channelApi => {
                if (channelApi.type == Discord.ChannelType.GuildText) {
                    this.channels.set(new ChannelCore(channelApi as any));
                }
            });
        }
        else {
            console.error("discord guild not initiate");
        }
        return this.channels;
    }


    // return the voice channel list
    getVoiceChannels(): MapName<VoiceChannel> {
        this.voiceChannels = new MapName<VoiceChannel>();
        if (this.discordApi.guild) {
            this.discordApi.guild.channels.cache.forEach(channelApi => {
                if (channelApi.type == Discord.ChannelType.GuildVoice) {
                    (channelApi as any).usersApi = function (){return this.members};
                    this.voiceChannels.set(new VoiceChannel(channelApi as any, this.usersApiToUsers.bind(this)));
                }
            });
        }
        else {
            console.error("discord guild not initiate");
        }
        return this.voiceChannels;
    }

    // return a user list from a user api list
    usersApiToUsers(usersApiList: Array<UserApi>): Array<User> {
        let users: Array<User> = [];
        if(this.users!=undefined) {
            let user: User;
            usersApiList.forEach( userApi => {
                user = this.users.get(userApi.id);
                if(user!=undefined) {
                    users.push(user);
                }
            });
        }
        return users;
    }


    // return the user server list
    getUsers(): MapNameId<User> {
        this.users = new MapNameId<User>();
        if (this.discordApi.guild) {
            this.discordApi.guild.members.cache.forEach(memberApi => {
                // change discord member to botSystem user
                let user = new User(memberApi.user, 
                    memberApi.roles as any, 
                    memberApi.voice as any,
                    memberApi.voice.channel != undefined ? this.voiceChannels.get(memberApi.voice.channel?.name) : undefined);
                this.users.set(user);
            });
        }
        else {
            console.error("discord guild not initiate");
        }
        return this.users;
    }

    // return the roles list
    getRoles(): MapNameId<Role> {
        this.roles = new MapNameId<Role>();
        if (this.discordApi.guild && this.users) {
            this.discordApi.guild.roles.cache.forEach(roleApi => {
                // Init role with user role And 
                let r: Role = roleApi as any;
                r.users = new MapNameId<User>();
                roleApi.members.forEach(memberApi => {
                    if (!memberApi.user.bot) {
                        let userFound = this.users.get(memberApi.user.id);
                        if (userFound) {
                            r.users.set(userFound);
                        }
                    }
                });
                this.roles.set(r);
            });

            // Complete user roles
            this.users.forEach(user => {
                user.roles.initUserRoles(this.roles);
            });
        }
        else {
            console.error("discord guild or users not initiate");
        }
        return this.roles;
    }

}