import { CommReturn, commReturnError, CommunicationAction, CommunicationFunction, MsgToSend, thenLogError } from "./comm-type"
import { Message, MessageCore } from "./message"
import { MessageComponent } from "./message-component/message-component"


export interface Channel {
    name: string
    send(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message>
    toString(): string
}

export class ChannelCore implements Channel {
    private channelApi: any
    readonly name: string
    private mentionStr: string

    commFunction: CommunicationFunction
    

    constructor(channelApi: any, channelName: string, mentionStr: string){
        this.channelApi = channelApi;
        this.name = channelName;
        this.mentionStr = mentionStr;
    }

    /*** Methods Use ***/

    /**
     * @returns Get channel mention
     */
    toString(){
        return this.mentionStr;
    }

    /**
     * Send a message in the channel
     * @param msg message to send
     * @param withReturn indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    send(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message> {
        // Adapt the message to the MsgToSend format
        let msgToSend: MsgToSend;
        let isMsgcNeededMsg = false;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
            (msg as MessageComponent).adapt();
            msgToSend = {components: (msg as MessageComponent), option: (msg as MessageComponent).msgOption};
            isMsgcNeededMsg = (msg as MessageComponent).needComm;
        }
        else {
            msgToSend = msg as MsgToSend;
        }

        // test, control, and adapt the message content for the api
        let shouldBeSent = true;
        if(this.commFunction.beforeSentFct != undefined){
            shouldBeSent = this.commFunction.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(withReturn);
        }

        if(withReturn || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.commFunction.commActionApi<MessageCore>(CommunicationAction.ChannelSend, msgToSend, this.channelApi, false).then( (newMsg) => {
                    newMsg.botAuthor = true;
                    newMsg.copyFct(this);
                    if(isMsgcNeededMsg) {
                        msgToSend.components.commSent = newMsg;
                    }
                    resolveFct(newMsg);
                });
            });
        }
        else {
            this.commFunction.commActionApi(CommunicationAction.ChannelSend, msgToSend, this.channelApi, true);
            return thenLogError;
        }
    }
}

