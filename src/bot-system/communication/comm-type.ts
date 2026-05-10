import Stream from "stream"
import { Role, User, UserApi } from "../user/user-type"
import { MessageComponent } from "./message-component/message-component"
import { Channel, ChannelApi } from "./channel"


interface ThenFct {
    then: () => void
}
export const thenLogError: ThenFct = {then: ()=>console.error('no promise activate')};
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


export interface CommunicationBaseApi<PromiseReplyType extends CommunicationBaseApi<PromiseReplyType>> {
    author: UserApi
    channel: ChannelApi
    reply(msg: string | MsgToSend | MessageComponent): Promise<PromiseReplyType>
    edit(msg: string | MsgToSend | MessageComponent): Promise<PromiseReplyType>
}

export interface CommunicationBase<PromiseReplyType> {
    author: User
    channel: Channel
    date: number // in ms since 1970

    reply(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<PromiseReplyType>
    edit(msg: string | MsgToSend | MessageComponent, getMsgSent?: boolean): CommReturn<PromiseReplyType>
    getCopy(): CommunicationBase<PromiseReplyType>
}



export const enum CommunicationAction {
    ChannelSend,
    MessageReply,
    MessageEdit,
    InteractionReply,
    InteractionEdit,
    InteractionModal

}

export interface CommunicationFunction {
    beforeSentFct: (msg: MsgToSend) => boolean

    getMentionedUserStr: (str: string) => User[] // get the mentioned user from a string
    getMentionedRoleStr: (str: string) => Role[] // get the mentioned role from a string
    getAllMentionedUserStr: (str: string) => User[] // get all the mentioned user from a string, even the user mentioned by a role

    apiAction: (action: CommunicationAction, apiObject: any, msgToSend: MsgToSend) => void
}