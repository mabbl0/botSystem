import Stream from "stream"
import { User } from "../user/user"
import { MessageComponent } from "./message-component/message-component"
import { Channel } from "./channel"
import { Role } from "../user/role"


interface ThenFct {
    then: () => void
}
export const thenLogError: ThenFct = {then: ()=>console.error('no promise activated')};
export type CommReturn<CommType> = Promise<CommType> | ThenFct;
export function commReturnError<CommType>(getCommReturn?: boolean): CommReturn<CommType> {
    if(getCommReturn) {
    return new Promise<CommType>((resolve) => resolve(undefined));
    }
    return thenLogError;
}

export interface MsgOption {
    ephemeral?: boolean // the message is temporary
    suspense?: boolean // send the message with a random time of suspense
}

export interface MsgToSend {
    content?: string
    option?: MsgOption
    files?: Stream[]
    components?: MessageComponent
}

export interface CommunicationBase<PromiseReplyType> {
    author: User
    channel: Channel
    date: number // in ms since 1970

    reply(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<PromiseReplyType>
    edit(msg: string | MsgToSend | MessageComponent, withReturn?: boolean): CommReturn<PromiseReplyType>

    commFunction: CommunicationFunction
}


/** @internal */
export const enum CommunicationAction {
    ChannelSend,

    MessageReply,
    MessageEdit,
    MessageDelete,

    InteractionReply,
    InteractionEdit,
    InteractionDefer
}

/** @internal */
export interface CommunicationFunction {
    beforeSentFct: (msg: MsgToSend) => boolean

    getMentionedUserStr: (str: string) => User[] // get the mentioned user from a string
    getMentionedRoleStr: (str: string) => Role[] // get the mentioned role from a string
    getAllMentionedUserStr: (str: string) => User[] // get all the mentioned user from a string, even the user mentioned by a role

    commActionApi: <PromiseReplyType>(action: CommunicationAction, msgToSend: MsgToSend, apiObject: any, withReturn: boolean) => CommReturn<PromiseReplyType>
}