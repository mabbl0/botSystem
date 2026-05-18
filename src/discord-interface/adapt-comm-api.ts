import Discord from "discord.js"

import { AdaptCommAPI } from "../bot-system/interface-api/interface-api-type"
import { DiscordInterface } from "./discord-interface-api"
import { MsgComponentAdapterApi, MsgComponentDisplayType } from "../bot-system/communication/message-component/message-component-type";
import { CommunicationAction, MsgToSend, CommReturn, thenLogError } from "../bot-system/communication/comm-type";
import { MsgComponentAdapter } from "./util/message-component-adapter";
import { Message, MessageCore } from "../bot-system/communication/message";

export class AdaptCommDiscord implements AdaptCommAPI {
    private discordApi: DiscordInterface
    private countButtonShowModal: number

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;
        this.countButtonShowModal = 0;
    }

    /**
     * @returns the message component adapter for discord
     */
    getMessageComponentAdapterConstructor(): new () => MsgComponentAdapterApi {
        return MsgComponentAdapter;
    }

    commActionApi<PromiseReplyType>(action: CommunicationAction, msg: MsgToSend, apiObject: any, withReturn: boolean): CommReturn<PromiseReplyType> {
        if (action == CommunicationAction.MessageDelete) {
            (apiObject as Discord.Message).delete();
            return thenLogError;
        }
        else if (action == CommunicationAction.InteractionDefer) {
            if ((apiObject as Discord.MessageComponentInteraction).deferUpdate != undefined) {
                (apiObject as Discord.MessageComponentInteraction).deferUpdate();
            }
            else {
                (apiObject as Discord.ChatInputCommandInteraction).deferReply();
            }

            return thenLogError;
        }


        // it is a message to send, reply or edit
        let msgToSend: any = {};

        // check if the message too long, needed to be truncate
        if (msg.content != undefined) {
            if (msg.content.length > 2000) {
                msgToSend.content = msgToSend.content.slice(0, 2000);
            }
            else {
                msgToSend.content = msg.content;
            }
        }

        // adapt message option
        msgToSend.flags = 0;
        if (msg.option?.ephemeral) {
            msgToSend.flags += Discord.MessageFlags.Ephemeral;
        }

        // adapt message Component
        let modalToSend = false;
        if (msg.components != undefined) {
            modalToSend = this.adaptMessageComponentToDiscord(msg, msgToSend);
        }


        // adapt the send if it is a modal
        if (modalToSend) {
            return this.sendModal(action, msg, msgToSend, apiObject, withReturn);
        }

        // it is not a modal to send
        return this.sendMsg(action, msg, msgToSend, apiObject, withReturn);
    }



    /**
     * Send the message
     * @param action the action to do
     * @param msgToSend the message to send with the modal
     * @param apiObject the api object
     * @param withReturn indicate if a return should be sent 
     */
    sendMsg<PromiseReplyType>(action: CommunicationAction, msgBS: MsgToSend, msgToSend: any, apiObject: any, withReturn: boolean): CommReturn<PromiseReplyType> {
        let isMsgcNeededMsg = msgBS.components != undefined && msgBS.components.needComm;

        switch (action) {
            case CommunicationAction.ChannelSend:
                if (withReturn || isMsgcNeededMsg) {
                    return new Promise<Message>((resolveFct) => {
                        (apiObject as Discord.TextChannel).send(msgToSend).then((msgApi) => {
                            let newMsg = this.newMsgFromDiscordResponse(msgApi);
                            resolveFct(newMsg);
                        });
                    });
                }
                else {
                    (apiObject as Discord.TextChannel).send(msgToSend);
                }
                break;
            case CommunicationAction.MessageReply:
                if (withReturn || isMsgcNeededMsg) {
                    return new Promise<Message>((resolveFct) => {
                        (apiObject as Discord.Message).reply(msgToSend).then((msgApi) => {
                            let newMsg = this.newMsgFromDiscordResponse(msgApi);
                            resolveFct(newMsg);
                        });
                    });
                }
                else {
                    (apiObject as Discord.Message).reply(msgToSend);
                }
                break;
            case CommunicationAction.MessageEdit:
                // in message edit, api can be not a Discord.Message, but a Interaction for the message component
                if ((apiObject as Discord.Message).edit != undefined) {
                    if (withReturn || isMsgcNeededMsg) {
                        return new Promise<Message>((resolveFct) => {
                            (apiObject as Discord.Message).edit(msgToSend).then((msgApi) => {
                                let newMsg = this.newMsgFromDiscordResponse(msgApi);
                                resolveFct(newMsg);
                            });
                        });
                    }
                    else {
                        (apiObject as Discord.Message).edit(msgToSend);
                    }
                }
                else if ((apiObject as Discord.MessageComponentInteraction).update != undefined) {
                    // try update
                    if (withReturn || isMsgcNeededMsg) {
                        return new Promise<Message>((resolveFct) => {
                            (apiObject as Discord.MessageComponentInteraction).update(msgToSend).then((interactionApi) => {
                                let newMsg = this.newMsgFromDiscordResponse(interactionApi as any);
                                resolveFct(newMsg);
                            });
                        });
                    }
                    else {
                        (apiObject as Discord.MessageComponentInteraction).update(msgToSend);
                    }
                }
                break;
            case CommunicationAction.InteractionReply:
                if (isMsgcNeededMsg) {
                    return new Promise<Message>((resolveFct) => {
                        (apiObject as Discord.ChatInputCommandInteraction).reply(msgToSend).then((interactionApi) => {
                            let newMsg = this.newMsgFromDiscordResponse(interactionApi as any);
                            resolveFct(newMsg);
                        });
                    });
                }
                else if (withReturn) {
                    return new Promise<Message>((resolveFct) => {
                        (apiObject as Discord.ChatInputCommandInteraction).reply(msgToSend);
                        (apiObject as Discord.ChatInputCommandInteraction).fetchReply().then((msgApi) => {
                            let newMsg = this.newMsgFromDiscordResponse(msgApi);
                            resolveFct(newMsg);
                        });
                    });
                }
                else {
                    (apiObject as Discord.ChatInputCommandInteraction).reply(msgToSend);
                }
                break;
            case CommunicationAction.InteractionEdit:
                if ((apiObject as Discord.MessageComponentInteraction).update != undefined) {
                    if (withReturn || isMsgcNeededMsg) {
                        return new Promise<Message>((resolveFct) => {
                            (apiObject as Discord.MessageComponentInteraction).update(msgToSend).then((interactionApi) => {
                                let newMsg = this.newMsgFromDiscordResponse(interactionApi as any);
                                resolveFct(newMsg);
                            });
                        });
                    }
                    else {
                        (apiObject as Discord.MessageComponentInteraction).update(msgToSend);
                    }
                }
                break;
            default:
                break;
        }
        return thenLogError;
    }



    /**
     * Send the modal
     * @param action the action to do
     * @param msgToSend the message to send with the modal
     * @param apiObject the api object
     * @param withReturn indicate if a return should be sent 
     */
    sendModal<PromiseReplyType>(action: CommunicationAction, msgBS: MsgToSend, msgToSend: any, apiObject: any, withReturn: boolean): CommReturn<PromiseReplyType> {
        let isMsgcNeededMsg = msgBS.components != undefined && msgBS.components.needComm;

        if (action == CommunicationAction.InteractionReply && apiObject.showModal != undefined) {
            if (withReturn || isMsgcNeededMsg) {
                return new Promise<Message>((resolve) => {
                    (apiObject as Discord.MessageComponentInteraction).showModal(msgToSend, { withResponse: true }).then((_interactionModalApi) => {
                        // the showModal promise return is unexploitable
                        // so build and return a message from the apiObject, which is here a interaction
                        // a interaction button (with a message) or interaction slash command (without message)
                        resolve( this.newMsgFromDiscordResponse(apiObject) );
                    });
                });
            }
            else {
                (apiObject as Discord.MessageComponentInteraction).showModal(msgToSend);
            }
        }
        else {
            // can not send direct modal
            // So send a message with a button to send the modal
            const buttonShowModalid = 'showModal_' + this.countButtonShowModal;
            const msgWithModalButton: any = {
                flags: Discord.MessageFlags.IsComponentsV2 + Discord.MessageFlags.Ephemeral,
                components: [{
                    type: Discord.ComponentType.ActionRow,
                    components: [{
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Primary,
                        customId: buttonShowModalid,
                        label: 'show modal'
                    }]
                }]
            };
            let collectorOption: Discord.MessageChannelCollectorOptionsParams<Discord.ComponentType.Button> = {
                filter: (interaction => interaction.customId == buttonShowModalid),
                time: 600_000 // 10min to click and show the modal
            };
            switch (action) {
                case CommunicationAction.ChannelSend:
                    return new Promise<Message>((resolve) => {
                        (apiObject as Discord.TextChannel).createMessageComponentCollector(collectorOption)
                            .on('collect', async modalButtonInteraction => {
                                modalButtonInteraction.showModal(msgToSend, { withResponse: true }).then((_interactionModalApi) => {
                                    resolve( this.newMsgFromDiscordResponse(modalButtonInteraction.message) );
                                });
                                if(modalButtonInteraction.message.deletable) {
                                    modalButtonInteraction.message.delete();
                                }
                            });
                        (apiObject as Discord.TextChannel).send(msgWithModalButton);
                    });
                    break;
                case CommunicationAction.MessageReply:
                    return new Promise<Message>((resolve) => {
                        (apiObject as Discord.Message).channel.createMessageComponentCollector(collectorOption)
                            .on('collect', async modalButtonInteraction => {
                                modalButtonInteraction.showModal(msgToSend, { withResponse: true }).then((_interactionModalApi) => {
                                    resolve( this.newMsgFromDiscordResponse(modalButtonInteraction.message) );
                                });
                                if(modalButtonInteraction.message.deletable) {
                                    modalButtonInteraction.message.delete();
                                }
                            });
                        (apiObject as Discord.Message).reply(msgWithModalButton);
                    });
                    break;
                case CommunicationAction.MessageEdit:
                    return new Promise<Message>((resolve) => {
                        (apiObject as Discord.Message).createMessageComponentCollector(collectorOption)
                            .on('collect', async modalButtonInteraction => {
                                modalButtonInteraction.showModal(msgToSend, { withResponse: true }).then((_interactionModalApi) => {
                                    resolve( this.newMsgFromDiscordResponse(modalButtonInteraction.message) );
                                });
                                if(modalButtonInteraction.message.deletable) {
                                    modalButtonInteraction.message.delete();
                                }
                            });
                        (apiObject as Discord.Message).edit(msgWithModalButton);
                    });
                    break;
                case CommunicationAction.InteractionEdit:
                    return new Promise<Message>((resolve) => {
                        (apiObject as Discord.MessageComponentInteraction).channel.createMessageComponentCollector(collectorOption)
                            .on('collect', async modalButtonInteraction => {
                                modalButtonInteraction.showModal(msgToSend, { withResponse: true }).then((_interactionModalApi) => {
                                    resolve( this.newMsgFromDiscordResponse(modalButtonInteraction.message) );
                                });
                                if(modalButtonInteraction.message.deletable) {
                                    modalButtonInteraction.message.delete();
                                }
                            });
                        (apiObject as Discord.MessageComponentInteraction).update(msgWithModalButton);
                    });
                    break;
                default:
                    break;
            }
            this.countButtonShowModal += 1;
        }
        return thenLogError;
    }


    /**
     * finish to Adapt the message component message to discord Api 
     * @param msg the message to adapt
     * @param msgToSend the message send to discord api
     * @returns indicate if it is a modal sent
     */
    adaptMessageComponentToDiscord(msg: MsgToSend, msgToSend: any): boolean {
        msg.components.prepareToSend();
        if (msg.components.displayType == MsgComponentDisplayType.Message) {
            msgToSend.flags += Discord.MessageFlags.IsComponentsV2;
        }
        else if (msg.components.displayType == MsgComponentDisplayType.Modal) {
            msgToSend.customId = msg.components.id;
            msgToSend.title = 'modal';
        }

        msgToSend.components = (msg.components.adapter as MsgComponentAdapter).msgcAdapted;

        // no content if flags componentV2
        if (msg.content != undefined) {
            msgToSend.components.splice(0, 0, {
                type: Discord.ComponentType.TextDisplay as number,
                content: msg.content
            });
        }
        return msg.components.displayType == MsgComponentDisplayType.Modal;
    }



    // Discord -> BotSystem

    /**
     * Create a new message from the discord Response
     * @param commApi the communication from the api
     * @returns the new message created
     */
    newMsgFromDiscordResponse(commApi: Discord.Message | Discord.InteractionResponse | Discord.ChatInputCommandInteraction): MessageCore {
        // commApi can be a Discord.Message or Discord.InteractionResponse
        let newMsg = new MessageCore();
        newMsg.msgApi = commApi;    // for now
        if ((commApi as Discord.ChatInputCommandInteraction).commandType == Discord.ApplicationCommandType.ChatInput) {
            let interactionCommand = commApi as Discord.ChatInputCommandInteraction;
            newMsg._author = this.discordApi.chat.users.get(interactionCommand.user.id);
            newMsg._channel = this.discordApi.chat.channels.get(interactionCommand.channel.name);
            newMsg._date = interactionCommand.createdTimestamp;
            // no message from this interaction ...
        } else if ((commApi as Discord.Message).cleanContent != undefined) {
            // commApi is Discord.message
            newMsg._author = this.discordApi.chat.users.get((commApi as Discord.Message).author.id);
            newMsg._channel = this.discordApi.chat.channels.get(((commApi as Discord.Message).channel as Discord.TextChannel).name);
            newMsg._date = (commApi as Discord.Message).createdTimestamp;
        }
        else {
            // comm is Discord.InteractionResponse
            let interactionRep = commApi as Discord.InteractionResponse;
            newMsg._author = this.discordApi.chat.users.get(interactionRep.client.user.id);
            newMsg._channel = this.discordApi.chat.channels.get(interactionRep.interaction.channel.name);
            newMsg._date = interactionRep.createdTimestamp;
            interactionRep.fetch().then((msgDiscord) => {
                // Warning: the msgDiscord ephemeral can not be editing or reply
                // message ephemeral does not existing for discord
                if ((msgDiscord.flags.bitfield & Discord.MessageFlags.Ephemeral) == 0) {
                    // not ephemeral
                    newMsg.msgApi = msgDiscord;
                }
            });
        }
        return newMsg;
    }
}
