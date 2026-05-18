import { RecycledItem } from "../../tools/collection/recycler";
import { User } from "../user/user";
import { Channel } from "./channel";
import { CommReturn, commReturnError, CommunicationAction, CommunicationBase, CommunicationFunction, MsgToSend, thenLogError } from "./comm-type";
import { Message, MessageCore } from "./message";
import { MessageComponent } from "./message-component/message-component";

/*** Interaction Interface Data Description ***/

export const enum InteractionType {
    SlashCmd,
    ContextMenuUser,
    ContextMenuMessage,
    MessageComponentInteraction,
    ModalSubmit
}

export const enum InteractionArgumentType {
    String,
    Integer,
    Boolean,
    User,
    Channel,
    Attachment,
    CommandGroup,
    Unkown
}

export function stringToArgType(argTypeStr: string): InteractionArgumentType {
    switch (argTypeStr) {
        case "string":
            return InteractionArgumentType.String;
        case "number":
            return InteractionArgumentType.Integer;
        case "boolean":
            return InteractionArgumentType.Boolean;
    }
    return InteractionArgumentType.Unkown;
}

interface InteractionChoice {
    name: string
    value: any
}

export interface InteractionArgument {
    name: string
    description: string
    type: InteractionArgumentType
    required?: boolean
    choices?: Array<InteractionChoice>
    arguments?: Array<InteractionArgument> // for argument group type
}

/*** Interaction Received After Command Use ***/

export interface InteractionArgumentValue {
    name: string
    type: InteractionArgumentType
    value: any
}



/*** Interaface Bot System Use ***/

export interface Interaction extends CommunicationBase<Message> {
    name: string

    deferAns(): void
    getArg<ArgValueType>(name: string, dafaultValue?: ArgValueType): ArgValueType
    getArguments<ArgsInterface extends { [key: string]: any }>(defaultArgs: ArgsInterface): ArgsInterface
    getChoice<ChoiceType>(defaultChoice: ChoiceType): ChoiceType
}

export class InteractionCore implements Interaction {
    interactApi: any
    _author: User
    _channel: Channel
    _date: number // in ms since 1970

    commFunction: CommunicationFunction

    type: InteractionType
    name: string
    arguments: Array<InteractionArgumentValue>
    choice: any

    /*** Getter ***/
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
     * copy the content of a interaction 
     * @param interactToCopy interaction to copy
     */
    copyContent(interactToCopy: InteractionCore) {
        this.interactApi = interactToCopy.interactApi;
        this._author = interactToCopy._author;
        this._channel = interactToCopy._channel;
        this._date = interactToCopy._date;

        this.type = interactToCopy.type;
        this.name = interactToCopy.name;
        this.arguments = [];
        interactToCopy.arguments.forEach(arg => this.arguments.push({
            name: arg.name,
            type: arg.type,
            value: arg.value
        }));
    }

    /**
     * copy the function of a interaction 
     * @param interactToCopy interaction to copy
     */
    copyFct(interactToCopy: {commFunction: CommunicationFunction}) {
        this.commFunction = interactToCopy.commFunction;
    }


    /*** Method Usage ***/

    /**
     * return a argument value, with its default value
     * @param name argument name
     * @param dafaultValue default value of the argument.
     * @returns return the argument value, with its default value if the argument not specify by the user 
     */
    getArg<ArgValueType>(name: string, dafaultValue?: ArgValueType): ArgValueType {
        let argFound = this.arguments.find(arg => arg.name === name);
        if (argFound) {
            return argFound.value;
        }
        return dafaultValue;
    }

    /**
     * return the arguments, with their default value
     * @param defaultArgs default value of the arguments. Also usefull to get argument name by the object key
     * @returns return the arguments, with their default value if argument not specify by the user 
     */
    getArguments<ArgsInterface extends { [key: string]: any }>(defaultArgs: ArgsInterface): ArgsInterface {
        const keys = Object.keys(defaultArgs) as (keyof ArgsInterface)[];
        keys.forEach(kStr => {
            let argFound = this.arguments.find(arg => arg.name === kStr);
            if (argFound) {
                if (argFound.type == InteractionArgumentType.CommandGroup) {
                    defaultArgs[kStr] = this.getArguments(defaultArgs[kStr]);
                }
                else {
                    defaultArgs[kStr] = argFound.value;
                }
            }
        });
        return defaultArgs;
    }

    /**
     * return the choices made in the interaction
     * @param defaultChoice the choice by default
     * @returns the choices made in the interaction
     */
    getChoice<ChoiceType>(defaultChoice: ChoiceType): ChoiceType {
        if(this.choice!=undefined) {
            return this.choice;
        }
        return defaultChoice;
    }

    // copy the interaction
    getCopy(): Interaction {
        let newInteract = new InteractionCore();
        newInteract.copyContent(this);
        return newInteract;
    }

    // defer the reply
    deferAns() {
        this.commFunction.commActionApi(CommunicationAction.InteractionDefer, undefined, this.interactApi, false);
    }


    /**
     * Reply to the interaction
     * @param msg message to send
     * @param withReturn indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    reply(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message> {
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
        if (this.commFunction.beforeSentFct != undefined) {
            shouldBeSent = this.commFunction.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(withReturn);
        }

        // reply to the message with or without promise
        if(withReturn || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.commFunction.commActionApi<MessageCore>(CommunicationAction.InteractionReply, msgToSend, this.interactApi, true).then( (newMsg) => {
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
            this.commFunction.commActionApi(CommunicationAction.InteractionReply, msgToSend, this.interactApi, false);
            return thenLogError;
        }
    }

    /**
     * Try to edit the message from the interaction
     * @param msg the new message
     * @param withReturn indicate to receive a promise when the message is editing
     * @returns a promise resolve when the message is sent if askeed
     */
    edit(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message> {
        if(this.type != InteractionType.MessageComponentInteraction) {
            // the interaction should be from a message component (button, ..)
            return commReturnError(withReturn);
        }
        
        // Adapt the message to the MsgToSend format
        let msgToSend: MsgToSend;
        let isMsgcNeededMsg = false;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
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

        // edit the message with or without promise
        if(withReturn || isMsgcNeededMsg) {
            return new Promise<Message>( (resolveFct) => {
                this.commFunction.commActionApi<MessageCore>(CommunicationAction.InteractionEdit, msgToSend, this.interactApi, true).then( (newMsg) => {
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
            this.commFunction.commActionApi(CommunicationAction.InteractionEdit, msgToSend, this.interactApi, false);
            return thenLogError;
        }
    }
}


export class InteractionRecycled extends InteractionCore implements RecycledItem<InteractionRecycled> {
    used: boolean
    trashBackFct: (item: InteractionRecycled) => void
    
    private waitReply: number
    private readyToTrash: boolean

    // Initiate the message with empty MessageApi, ready to be used then recycled
    constructor(trashBackFct: (item: InteractionRecycled) => void){
        super();
        
        this.trashBackFct = trashBackFct;
        this.resetValues();
    }

    // reset class values
    private resetValues(){
        this.used = false;
        this.waitReply = 0;
        this.readyToTrash = false;
    }

    /**
     * Reply to the interaction
     * @param msg message to send
     * @param withReturn indicate to get a promise with the new message sent
     * @returns a promise resolve when the message is sent if askeed
     */
    override reply(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message> {
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
        if (this.commFunction.beforeSentFct != undefined) {
            shouldBeSent = this.commFunction.beforeSentFct(msgToSend);
        }
        if(shouldBeSent==false) {
            return commReturnError(withReturn);
        }

        // reply to the message with or without promise
        if(withReturn || isMsgcNeededMsg) {
            this.waitReply += 1;
            return new Promise<Message>( (resolveFct) => {
                this.commFunction.commActionApi<MessageCore>(CommunicationAction.InteractionReply, msgToSend, this.interactApi, true).then( (newMsg) => {
                    newMsg.botAuthor = true;
                    newMsg.copyFct(this);
                    if(isMsgcNeededMsg) {
                        msgToSend.components.commSent = newMsg;
                    }
                    resolveFct(newMsg);

                    this.waitReply += -1;
                    if(this.readyToTrash){
                        this.trash();                    
                    }
                    
                });
            });
        }
        else {
            this.commFunction.commActionApi(CommunicationAction.InteractionReply, msgToSend, this.interactApi, false);
            return thenLogError;
        }
    }

    /**
     * Try to edit the message from the interaction
     * @param msg the new message
     * @param withReturn indicate to receive a promise when the message is editing
     * @returns a promise resolve when the message is sent if askeed
     */
    override edit(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<Message> {
        if(this.type != InteractionType.MessageComponentInteraction) {
            // the interaction should be from a message component (button, ..)
            return commReturnError(withReturn);
        }

        // Adapt the message to the MsgToSend format
        let isMsgcNeededMsg = false;
        let msgToSend: MsgToSend;
        if((msg as string).trim != undefined){
            msgToSend = {content: msg as string};
        }
        else if((msg as MessageComponent).id != undefined) {
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

        // edit the message with or without promise
        if(withReturn || isMsgcNeededMsg) {
            this.waitReply += 1;
            return new Promise<Message>( (resolveFct) => {
                this.commFunction.commActionApi<MessageCore>(CommunicationAction.InteractionEdit, msgToSend, this.interactApi, true).then( (newMsg) => {
                    newMsg.botAuthor = true;
                    newMsg.copyFct(this);
                    if(isMsgcNeededMsg) {
                        msgToSend.components.commSent = newMsg;
                    }
                    resolveFct(newMsg);

                    this.waitReply += -1;
                    if(this.readyToTrash){
                        this.trash();                    
                    }
                });
            });
        }
        else {
            this.commFunction.commActionApi(CommunicationAction.InteractionEdit, msgToSend, this.interactApi, false);
            return thenLogError;
        }
    }

    // recycle the unused interaction to be re-used
    recycle(interactApi: any){
        if(!this.used){
            this.interactApi = interactApi;
            this.used = true;
        }
    }

    // clean it in the recycler
    trash(){
        if(!this.used){
            return;
        }

        if(this.waitReply>0){
            this.readyToTrash = true;
            return; // msg still use, wait reply end
        }

        this.resetValues();
        this.trashBackFct( this );
    }
}