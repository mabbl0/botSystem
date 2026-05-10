import { UnitComponent } from '../component/unit-component';
import type { CommunicationConf } from '../bot-system-type';
import { MapId, MapName } from '../../tools/collection/map';
import { MessageComponent } from './message-component/message-component';
import { MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentInteractive } from './message-component/message-component-type';
import { Message, MessageApi, MessageCore, MessageFunctionCore } from './message';
import { Channel, ChannelCore } from './channel';
import { CommReturn, MsgToSend, thenLogError } from './comm-type';
import { Interaction } from './interaction';


export class CommManager extends UnitComponent {
    private commConf: CommunicationConf

    private channels: MapName<ChannelCore>
    private generalChannel: Channel
    private botChannel: Channel
    private msgFct: MessageFunctionCore

    private _adaptMsgContentFromApi: (msg: MessageCore, msgApi: MessageApi) => void
    private _postMsg: (messageApi: MessageApi, msg: MsgToSend) => void
    private _newMessageComponentAdapter: new () => MsgComponentAdapterApi

    /** Msg Component **/
    private msgcCounter: number
    private msgComponentInteractions: MapId<MsgComponentInteractive>

    constructor(commConf: CommunicationConf) {
        super("CommManager", "Manage Communication (message, channel, button, ..)");

        this.commConf = commConf;

        this.msgcCounter = 0;
        this.msgComponentInteractions = new MapId<MsgComponentInteractive>();

        /** Declare Methods **/
        this.mthInterface.addMethod("sendMsg", this.sendMsg.bind(this));
        this.mthInterface.addMethod("sendMsgToGeneralChannel", this.sendMsgToGeneralChannel.bind(this));
        this.mthInterface.addMethod("sendMsgToBotChannel", this.sendMsgToBotChannel.bind(this), { onlyBsComponent: true });
        this.mthInterface.addMethod("getChannel", this.getChannel.bind(this));

        /** Declare Methods for CommInterface **/
        this.mthInterface.addMethod("createMessageComponent", this.createMessageComponent.bind(this));


        /** Text Command **/
        if (this.commConf.noButton) {
            this.cmdInterface.addTxtCmd('click', 'emulate a click button, ..', this.txtCmdClick.bind(this));
        }
    }

    // Initiate the channels
    initChannels(channels: MapName<ChannelCore>, msgFct: MessageFunctionCore) {
        this.msgFct = msgFct;
        if (this.channels == undefined) {
            this.channels = channels;

            this.generalChannel = this.channels.get(this.commConf.generalChannel);
            if (this.generalChannel == undefined) {
                this.logError("general channel (" + this.commConf.generalChannel + ") not found");
            }

            this.botChannel = this.channels.get(this.commConf.botChannel);
            if (this.botChannel == undefined) {
                this.logError("bot channel (" + this.commConf.botChannel + ") not found");
            }

            this.channels.forEach(channel => {
                channel.msgFct = this.msgFct;
            });
            this.logInfo(`${channels.size} Channels initiate`);
        }
    }

    // new channel created
    createNewChannel(newChannel: ChannelCore) {
        if (this.channels) {
            // check if it is not already added to the list by the interfaceApi
            if (!this.channels.has(newChannel.name)) {
                this.channels.set(newChannel);
                newChannel.msgFct = this.msgFct;
            }
        }
    }

    set adaptMsgContentFromApi(fct: (msg: MessageCore, msgApi: MessageApi) => void) {
        if(this._adaptMsgContentFromApi == undefined) { // only once
            this._adaptMsgContentFromApi = fct;
        }
    }
    set newMessageComponentAdapter(construct: new () => MsgComponentAdapterApi) {
        if(this._newMessageComponentAdapter == undefined) { // only once
            this._newMessageComponentAdapter = construct;
        }
    }
    set postMsgApi(fct: (messageApi: MessageApi, msg: MsgToSend) => void) {
        if(this._postMsg == undefined) { // only once
            this._postMsg = fct;
        }
    }

    // Adapt the message content from a api message
    adaptMessageContent(msg: MessageCore, msgApi: MessageApi) {
        if(this._adaptMsgContentFromApi != undefined) {
            return this._adaptMsgContentFromApi(msg, msgApi);
        }
    }

    postMsg(messageApi: MessageApi, msg: MsgToSend) {
        if(this._postMsg != undefined) {
            this._postMsg(messageApi, msg);
        }
    }

    /*** Methods ***/

    // Method to Send a message to a channel
    sendMsg(channelName: string, msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        if (this.channels) {
            let channel = this.channels.get(channelName);
            if (channel) {
                return channel.send(msg, getMsgSent);
            }
            else {
                this.logError("channel not found: " + channelName);
                if(getMsgSent) {
                    return new Promise<Message>(resolveFct => resolveFct(undefined));
                }
            }
        }
        else {
            this.logError("Channels not Initiate");
            if(getMsgSent) {
                return new Promise<Message>(resolveFct => resolveFct(undefined));
            }
        }
        return thenLogError;
    }

    // Method to Send a message to the general channel
    sendMsgToGeneralChannel(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        if (this.generalChannel) {
            return this.generalChannel.send(msg, getMsgSent);
        }
        else {
            this.logError("general Channel not Initiate");
            if(getMsgSent) {
                return new Promise<Message>(resolveFct => resolveFct(undefined));
            }
        }
        return thenLogError;
    }

    // Method to Send a message to the bot channel
    sendMsgToBotChannel(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        if (this.botChannel) {
            return this.botChannel.send(msg, getMsgSent);
        }
        else {
            this.logError("bot Channel not Initiate");
            if(getMsgSent) {
                return new Promise<Message>(resolveFct => resolveFct(undefined));
            }
        }
        return thenLogError;
    }

    // Get a Channel by its name
    getChannel(channelName: string): Channel {
        return this.channels.get(channelName);
    }


    /*** MsgComponent Interaction ***/

    // command in case the interface api does not have msgComponent such as button
    txtCmdClick(msg: MessageCore, arg: string) {
        this.messageComponentInteraction(msg.toInteraction(arg));
    }


    /**
     * add some message component interaction
     * @param msgComponentInteract the message component interaction to add
     */
    private addMsgComponentInteraction(msgComponentInteract: MsgComponentInteractive[]) {
        for (let i = 0; i < msgComponentInteract.length; i++) {
            if(msgComponentInteract[i].interactionFct == undefined) {
                continue;
            }
            if(this.msgComponentInteractions.has(msgComponentInteract[i].id)) {
                // already this id
                continue;
            }
            
            if(msgComponentInteract[i].id == undefined) {
                msgComponentInteract[i].id = this.msgcCounter.toString();
            }
            this.msgComponentInteractions.set(msgComponentInteract[i]);
            this.msgcCounter += 1;
        }
    }

    /**
     * remove the message component interaction
     * @param msgComponentInteract the message component interaction to remove
     */
    private removeMsgComponentInteraction(msgComponentInteract: MsgComponentInteractive[]) {
        msgComponentInteract.forEach( msgci =>
            this.msgComponentInteractions.delete(msgci.id)
        );
    }

    /**
     * Create and return a message component to add text, buttons, .. to a message
     * @param componentName component name which ask the message component
     * @returns the message component to add text, buttons, ..
     */
    createMessageComponent(componentName: string, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message): MessageComponent {
        let msgcId = 'msgc' + this.msgcCounter + '_';
        this.msgcCounter += 1;
        let newMsgComponent = new MessageComponent(msgcId,
            this.addMsgComponentInteraction.bind(this),
            this.removeMsgComponentInteraction.bind(this),
            this._newMessageComponentAdapter,
            displayType
        );
        this.logInfo(`${componentName} Component get the message component '${msgcId}'`);
        return newMsgComponent;
    }


    /**
     * interaction receive after a message component interaction
     * buttons, string select, ..
     * @param interaction interaction received
     */
    messageComponentInteraction(interaction: Interaction) {
        let msgciFound = this.msgComponentInteractions.get(interaction.name);
        if (!msgciFound) {
            this.logInfo(`msg component clicked by ${interaction.author.name} not found: '${interaction.name}'`);
            return;
        }

        if (msgciFound.option?.adminOnly && !interaction.author.admin) {
            this.logInfo(`${interaction.author.name} try to click to admin msg component: '${msgciFound.id}'`);
            return;
        }

        this.logInfo(`message component '${msgciFound.id}' clicked by ${interaction.author.name}`);
        msgciFound.interactionFct(interaction, msgciFound);
    }


}