import { MessageComponentBase, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

/*** Text Message Component ***/
export class TextMsgComponent extends MessageComponentBase {
    #text: string

    /** @internal */
    constructor(msgcOwner: MessageComponentBase, text: string, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Text);
        this.#text = text;
    }

    get text() {
        this.modified = true;
        return this.#text;
    }
    set text(t: string) {
        this.modified = true;
        this.#text = t;
    }
}


/*** Separator Message Component ***/

export class Separator extends MessageComponentBase {
    /** @internal */
    constructor(msgcOwner: MessageComponentBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Separator);
    }
}


