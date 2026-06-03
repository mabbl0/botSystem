import { Button, ButtonBase } from "./button";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

export class AccessoryButton extends MessageComponentBase {
    #button: Button
    #text: string
    #adapterConstruct: new () => MsgComponentAdapterApi

    /** @internal */
    constructor(msgcOwner: MessageComponentBase, text: string, button: ButtonBase, adapterConstruct?: new () => MsgComponentAdapterApi, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message){
        super(msgcOwner, displayType, MsgComponentType.AccessoryButton);
        this.#adapterConstruct = adapterConstruct;
        this.#text = text;

        this.#button = new Button(this, button);
        this.#button.adapter = new this.#adapterConstruct();
        this.interactiveComponents = [ this.#button ];
    }

    get text() {
        this.modified = true;
        return this.#text;
    }
    set text(t: string) {
        this.modified = true;
        this.#text = t;
    }
    get button() {
        this.modified = true;
        return this.#button;
    }
    setButton(button: ButtonBase) {
        this.#button = new Button(this, button);
        this.#button.adapter = new this.#adapterConstruct();
        this.interactiveComponents = [ this.#button ];
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
        this.#button.destroy();
        this.#button = undefined;
    }
}