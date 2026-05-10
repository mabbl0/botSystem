import { CommReturn, commReturnError, MsgToSend, thenLogError } from "./comm-type"
import { Message, MessageApi, MessageFunctionCore } from "./message"
import { MessageComponent } from "./message-component/message-component"


// channel information
export interface ChannelApi {
    name: string
    send(msg: string | MsgToSend | MessageComponent): Promise<MessageApi>
    toString(): string
}

export interface Channel {
    name: string
    send(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message>
    toString(): string
}

export class ChannelCore implements Channel {
    private channelApi: ChannelApi
    private _beforeSentFct: (msg: MsgToSend) => boolean
    
    msgFct: MessageFunctionCore // useful for the message (send, copy, ..)
    

    constructor(channelApi: ChannelApi){
        this.channelApi = channelApi;
    }

    get name() {
        return this.channelApi.name;
    }

    set beforeSentFct(fct: (msg: string | MsgToSend) => boolean){
        if(this._beforeSentFct == undefined){  // set once
            this._beforeSentFct = fct;
        }
    }

    /*** Methods Use ***/

    /**
     * Send a message in the channel
     * @param msg message to send
     * @param getMsgSent indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    send(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        // Adapt the message to the MsgToSend format
        let msgToSend: MsgToSend;
        let isMsgcNeededMsg = false;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
            isMsgcNeededMsg = (msg as MessageComponent).needMsg;
            (msg as MessageComponent).adapt();
            msgToSend = {components: (msg as MessageComponent), option: (msg as MessageComponent).msgOption};
        }
        else {
            msgToSend = msg as MsgToSend;
        }

        // test, control, and adapt the message content for the api
        let shouldBeSent = true;
        if(this._beforeSentFct != undefined){
            shouldBeSent = this._beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(getMsgSent);
        }

        if(getMsgSent || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.channelApi.send(msgToSend).then( (msgApi) => {
                    let newMsg = new this.msgFct.messageConstructor();
                    newMsg.copyFct(this);
                    this.msgFct.adaptNewMessageContent(newMsg, msgApi);
                    newMsg.botAuthor = true;
                    if(isMsgcNeededMsg) {
                        (msg as MessageComponent).msgSent = newMsg;
                    }
                    resolveFct(newMsg);
                });
            });
        }
        else {
            this.channelApi.send(msgToSend);
            return thenLogError;
        }
    }

    /**
     * 
     * @returns Get channel mention
     */
    toString(){
        return this.channelApi.toString();
    }
}

