import { Button, ButtonBase } from "./button";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentType } from "./message-component-type";

export class ButtonRow extends MessageComponentBase {
    private _buttons: Button[]
    private adapterConstruct: new () => MsgComponentAdapterApi

    constructor(msgcOwner: MessageComponentBase, buttons?: ButtonBase[], adapterConstruct?: new () => MsgComponentAdapterApi, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.ButtonRow);
        this.adapterConstruct = adapterConstruct;

        this._buttons = [];
        buttons?.forEach(b => {
            let newButton = new Button(this, b);
            newButton.adapter = new this.adapterConstruct();
            this._buttons.push(newButton);
        });

        this.interactiveComponents = this._buttons;
    }

    get buttons() {
        this.modified = true;
        return this._buttons;
    }
    
    /**
     * @returns a unique id for the message component
     */
    override getUniqueId(): string {
        if(this.msgcOwner!=undefined && this.msgcOwner.getUniqueId!=undefined) {
            return this.msgcOwner.getUniqueId();
        }
        else {
            return this._buttons.length.toString();
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
        this._buttons.forEach(b => {
            b.destroy();
        });
        this._buttons = undefined;
        this.modified = true;
    }

    /**
     * add 1 button
     * @param button button to add
     */
    addButton(button: ButtonBase) {
        let newButton = new Button(this, button);
        newButton.adapter = new this.adapterConstruct();
        this._buttons.push(newButton);
        this.modified = true;
    }
}