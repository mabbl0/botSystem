import { MessageComponentBase, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

/*** Text Message Component ***/
export class TextMsgComponent extends MessageComponentBase {
    private _text: string

    constructor(msgcOwner: MessageComponentBase, text: string, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Text);
        this._text = text;
    }

    get text() {
        this.modified = true;
        return this._text;
    }
    set text(t: string) {
        this.modified = true;
        this._text = t;
    }
}


/*** Separator Message Component ***/

export class Separator extends MessageComponentBase {
    constructor(msgcOwner: MessageComponentBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Separator);
    }
}


