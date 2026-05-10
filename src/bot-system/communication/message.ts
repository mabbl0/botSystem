import { RecycledItem } from "../../tools/collection/recycler"
import { Role, User } from "../user/user-type"
import { Channel } from "./channel"
import { CommReturn, commReturnError, CommunicationBase, CommunicationBaseApi, MsgToSend, thenLogError } from "./comm-type"
import { Interaction } from "./interaction"
import { MessageComponent } from "./message-component/message-component"

// TODO: add suspense send message
/**
const SuspenseProbArr: ProbArray<string> = [ "...", "Suspense ...", "🥁 ...", "🫣 ..", "🥱 ..." ];

// recursive method to reply with suspense
function suspenseSendRecursive(msg: MsgToSend, sendMth: (msg: string | MsgToSend)=>Promise<MessageApi>, nextSendMth: (msg: string | MsgToSend)=>Promise<MessageApi>, nbSuspenseMsg: number): Promise<Message>{
    return new Promise<Message>(resolveFct => {
        let timeWait = randInt(100,1000); // in ms
        if(nbSuspenseMsg < 1){ // wait - msg
            setTimeout(() => {
                sendMth(msg).then( msgApi => resolveFct( new Message(msgApi)) );
            }, timeWait);
        }
        else { // wait - suspense msg - wait - .. 
            setTimeout(() => {
                sendMth( choiceProbArr(SuspenseProbArr) )
                    .then( () => suspenseSendRecursive(msg, nextSendMth, nextSendMth, nbSuspenseMsg-1).then( resolveFct ) );
            }, timeWait);
        }
    });
}

return suspenseSendRecursive(msg as MsgToSend, this.channelApi.send.bind(this.channelApi), this.channelApi.send.bind(this.channelApi), randInt(3) );
 */

export interface MessageApi extends CommunicationBaseApi<MessageApi> {
    content: string
    delete(): void 
}

interface HasMention {
    getMentionedUser(): User[]
    getMentionedRole(): Role[]
    getAllMentionedUser(): User[]
}

export interface Message extends CommunicationBase<Message>, HasMention {
    content: string
    delete(): void
}


export interface MessageFunctionCore {
    beforeSentFct: (msg: MsgToSend) => boolean

    getMentionedUserStr: (str: string) => User[] // get the mentioned user from a string
    getMentionedRoleStr: (str: string) => Role[] // get the mentioned role from a string
    getAllMentionedUserStr: (str: string) => User[] // get all the mentioned user from a string, even the user mentioned by a role

    adaptNewMessageContent: (msg: MessageCore, msgApi: MessageApi) => void

    postMsg: (messageApi: MessageApi, msg: MsgToSend) => void

    messageConstructor: new () => MessageCore
}


export class MessageCore implements Message {
    msgApi: MessageApi
    _author: User
    _channel: Channel
    _date: number // in ms since 1970

    protected deleted: boolean
    botAuthor: boolean
    msgFct: MessageFunctionCore

    constructor() {
        this.resetValues();
    }

    /*** Getter ***/
    get content() {
        return this.msgApi ? this.msgApi.content : '';
    }
    get author() {
        return this._author;
    }
    get channel() {
        return this._channel;
    }
    get date() {
        return this._date;
    }

    /*** Functional Methods ***/

    /**
     * reset the class values
     */
    protected resetValues(){
        this.deleted = false;
        this.botAuthor = false;
    }

    /**
     * copy the content of a message 
     * @param msgToCopy message to copy
     */
    copyContent(msgToCopy: MessageCore) {
        this.msgApi = msgToCopy.msgApi;
        this._author = msgToCopy._author;
        this._channel = msgToCopy._channel;
        this._date = msgToCopy._date;
    }

    /**
     * copy the function of a message 
     * @param msgToCopy message to copy
     */
    copyFct(msgToCopy: {msgFct: MessageFunctionCore}) {
        this.msgFct = msgToCopy.msgFct;
    }

    /**
     * Create an interaction from this message
     * @param name interaction name
     */
    toInteraction(_name: string): Interaction {
        return undefined;
    }

    /*** Get the Mention in the content ***/

    // get the mentioned user in the content message
    getMentionedUser(): User[] {
        return this.msgFct.getMentionedUserStr ? this.msgFct.getMentionedUserStr(this.content) : [];
    }
    // get the mentioned role in the content message
    getMentionedRole(): Role[] {
        return this.msgFct.getMentionedRoleStr ? this.msgFct.getMentionedRoleStr(this.content) : [];
    }
    // get the mentioned user in the content message
    getAllMentionedUser(): User[] {
        return this.msgFct.getAllMentionedUserStr ? this.msgFct.getAllMentionedUserStr(this.content) : [];
    }


    /*** Method Usage ***/

    /**
     * create a copy of the message
     * @returns the new message
     */
    getCopy(): MessageCore {
        let newMsg = new MessageCore();
        newMsg.copyContent(this);
        newMsg.copyFct(this);
        return newMsg;
    }

    /**
     * ask to delete the message
     */
    delete() {
        this.deleted = true;
        if(this.msgApi.delete != undefined) {
            this.msgApi.delete();
        }
    }

    /**
     * Reply to the message
     * @param msg message to send
     * @param getMsgSent indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    reply(msg: string | MessageComponent | MsgToSend , getMsgSent?: boolean): CommReturn<Message> {
        if(this.deleted) {
            return commReturnError(getMsgSent);
        }
        
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
        if(this.msgFct.beforeSentFct != undefined){
            shouldBeSent = this.msgFct.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(getMsgSent);
        }

        // reply to the message with or without promise
        if(getMsgSent || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.msgApi.reply(msgToSend).then( (msgApi) => {
                    let newMsg = new MessageCore();
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
            this.msgApi.reply(msgToSend);
            return thenLogError;
        }
    }

    /**
     * Try to edit the message
     * @param msg the new message
     * @param getMsgSent indicate to receive a promise when the message is editing
     * @returns a promise resolve when the message is sent if askeed
     */
    edit(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        if(this.botAuthor==false || this.deleted) {
            // the message should be sent by the bot and not deleted to be editing
            return commReturnError(getMsgSent);
        }

        // Adapt the message to the MsgToSend format
        let msgToSend: MsgToSend;
        let isMsgcNeededMsg = false;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
            isMsgcNeededMsg = (msg as MessageComponent).needMsg;
            msgToSend = {components: (msg as MessageComponent), option: (msg as MessageComponent).msgOption};
        }
        else {
            msgToSend = msg as MsgToSend;
        }

        // test, control, and adapt the message content for the api
        let shouldBeSent = true;
        if(this.msgFct.beforeSentFct != undefined){
            shouldBeSent = this.msgFct.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(getMsgSent);
        }

        // edit the message with or without promise
        if(getMsgSent || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.msgApi.edit(msgToSend).then( () => {
                    if(isMsgcNeededMsg) {
                        (msg as MessageComponent).msgSent = this;
                    }
                    resolveFct(this);
                });
            });
        }
        else {
            this.msgApi.edit(msgToSend);
            return thenLogError;
        }
    }
}



// Message which can be recycled tanks to a recycler
export class MessageRecycled extends MessageCore implements RecycledItem<MessageRecycled> {
    used: boolean
    trashBackFct: (item: MessageRecycled) => void

    private shouldBeDeleted: boolean
    private waitReply: number
    private readyToTrash: boolean

    // Initiate the message with empty MessageApi, ready to be used then recycled
    constructor(trashBackFct: (item: MessageRecycled) => void){
        super();
        
        this.trashBackFct = trashBackFct;
        this.resetValues();
    }

    // reset class values
    override resetValues(){
        super.resetValues();
        this.used = false;
        this.shouldBeDeleted = false;
        this.waitReply = 0;
        this.readyToTrash = false;
    }

    
    /**
     * Reply to the message
     * @param msg message to send
     * @param getMsgSent indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    override reply(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<Message> {
        if(this.deleted) {
            return commReturnError(getMsgSent);
        }
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
        if(this.msgFct.beforeSentFct != undefined){
            shouldBeSent = this.msgFct.beforeSentFct(msgToSend);
        }
        if(shouldBeSent == false) {
            return commReturnError(getMsgSent);
        }
        
        // reply to the message with or without promise
        if(getMsgSent || isMsgcNeededMsg) {
            this.waitReply += 1;
            return new Promise<Message>( (resolveFct) => {
                this.msgApi.reply(msgToSend).then( (msgApi) => {
                    let newMsg = new MessageCore();
                    newMsg.copyFct(this);
                    this.msgFct.adaptNewMessageContent(newMsg, msgApi);
                    newMsg.botAuthor = true;
                    if(isMsgcNeededMsg) {
                        (msg as MessageComponent).msgSent = newMsg;
                    }
                    resolveFct(newMsg);

                    this.waitReply += -1;
                    if(this.readyToTrash){
                        this.trash();                    
                    }
                });
            });
        }
        else if(this.shouldBeDeleted) {
            this.waitReply += 1;
            this.msgApi.reply(msgToSend).then( () => {
                this.waitReply += -1;
                if(this.readyToTrash){
                    this.trash();                    
                }
            });
            return thenLogError;
        }
        else {
            this.msgApi.reply(msgToSend);
            return thenLogError;
        }
    }

    /**
     * Try to edit the message
     * @param msg the new message
     * @param getMsgSent indicate to receive a promise when the message is editing
     * @returns a promise resolve when the message is sent if askeed
     */
    override edit(msg: string | MessageComponent | MsgToSend, getMsgSent?: boolean): CommReturn<Message> {
        if(this.botAuthor==false || this.deleted || this.shouldBeDeleted) {
            // the message should be sent by the bot and not deleted to be editing
            return commReturnError(getMsgSent);
        }

        // Adapt the message to the MsgToSend format
        let msgToSend: MsgToSend;
        let isMsgcNeededMsg = false;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
            isMsgcNeededMsg = (msg as MessageComponent).needMsg;
            msgToSend = {components: (msg as MessageComponent), option: (msg as MessageComponent).msgOption};
        }
        else {
            msgToSend = msg as MsgToSend;
        }

        // test, control, and adapt the message content for the api
        let shouldBeSent = true;
        if(this.msgFct.beforeSentFct != undefined){
            shouldBeSent = this.msgFct.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(getMsgSent);
        }

        // edit the message with or without promise
        if(getMsgSent || isMsgcNeededMsg) {
            this.waitReply += 1;
            return new Promise<Message>( (resolveFct) => {
                this.msgApi.edit(msgToSend).then( () => {
                    if(isMsgcNeededMsg) {
                        (msg as MessageComponent).msgSent = this.getCopy(); // give a copy to not be 
                    }
                    resolveFct(this);

                    this.waitReply += -1;
                    if(this.readyToTrash){
                        this.trash();                    
                    }
                });
            });
        }
        else {
            this.msgApi.edit(msgToSend);
            return thenLogError;
        }
    }

    // overload to delete the message at the trash moment
    override delete(){
        this.shouldBeDeleted = true;
    }

    // recycle the unused message to be re-used
    recycle(msgApi: MessageApi){
        if(!this.used){
            this.msgApi = msgApi;
            this.used = true;
        }
    }

    // desactivate the message, delete the message if needed
    // and clean it in the recycler
    trash(){
        if(!this.used){
            return;
        }

        if(this.waitReply>0){
            this.readyToTrash = true;
            return; // msg still use, wait reply end
        }
        if(this.shouldBeDeleted){
            super.delete();
        }
        this.resetValues();
        this.trashBackFct( this );
    }

}
