import { Button, ButtonBase } from "./button";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

export class ButtonRow extends MessageComponentBase {
    #buttons: Button[]
    #adapterConstruct: new () => MsgComponentAdapterApi

    /** @internal */
    constructor(msgcOwner: MessageComponentBase, buttons?: ButtonBase[], adapterConstruct?: new () => MsgComponentAdapterApi, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.ButtonRow);
        this.#adapterConstruct = adapterConstruct;

        this.#buttons = [];
        buttons?.forEach(b => {
            let newButton = new Button(this, b);
            newButton.adapter = new this.#adapterConstruct();
            this.#buttons.push(newButton);
        });

        this.interactiveComponents = this.#buttons;
    }

    get buttons() {
        this.modified = true;
        return this.#buttons;
    }
    
    /**
     * @returns a unique id for the message component
     */
    override getUniqueId(): string {
        if(this.msgcOwner!=undefined && this.msgcOwner.getUniqueId!=undefined) {
            return this.msgcOwner.getUniqueId();
        }
        else {
            return this.#buttons.length.toString();
        }
    }

    /**
     * try to adapt the buttons to the api
     * @returns indicate if the message component is a new button row
     */
    override adapt(): boolean {
        // try to adapt in any case
        this.adapter?.adapt(this);
        
        if(this.isNew) {
            this.isNew = false;
            return true;
        }
        return false;
    }

    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.#buttons.forEach(b => {
            b.destroy();
        });
        this.#buttons = undefined;
        this.modified = true;
    }

    /**
     * add 1 button
     * @param button button to add
     */
    addButton(button: ButtonBase) {
        let newButton = new Button(this, button);
        newButton.adapter = new this.#adapterConstruct();
        this.#buttons.push(newButton);
        this.modified = true;
    }
}