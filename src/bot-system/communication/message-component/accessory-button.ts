import { Button, ButtonBase } from "./button";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

export class AccessoryButton extends MessageComponentBase {
    private _button: Button
    private _text: string
    private adapterConstruct: new () => MsgComponentAdapterApi

    constructor(msgcOwner: MessageComponentBase, text: string, button: ButtonBase, adapterConstruct?: new () => MsgComponentAdapterApi, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message){
        super(msgcOwner, displayType, MsgComponentType.AccessoryButton);
        this.adapterConstruct = adapterConstruct;
        this._text = text;

        this._button = new Button(this, button);
        this._button.adapter = new this.adapterConstruct();
        this.interactiveComponents = [ this._button ];
    }

    get text() {
        this.modified = true;
        return this._text;
    }
    set text(t: string) {
        this.modified = true;
        this._text = t;
    }
    get button() {
        this.modified = true;
        return this._button;
    }
    setButton(button: ButtonBase) {
        this._button = new Button(this, button);
        this._button.adapter = new this.adapterConstruct();
        this.interactiveComponents = [ this._button ];
        this.modified = true;
    }
    
    /**
     * @returns a unique id for the message component
     */
    override getUniqueId(): string {
        if(this.msgcOwner!=undefined && this.msgcOwner.getUniqueId!=undefined) {
            return this.msgcOwner.getUniqueId();
        }
        else {
            return 'accessoryButton';
        }
    }

    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this._button.destroy();
        this._button = undefined;
    }
}