import { Interaction } from "../interaction"
import { MessageComponentBase, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type"

export const enum ButtonColor {
    Black,
    Red,
    Green,
    Blue
}

// button option
interface ButtonOption extends MsgComponentInteractiveOption {
    disable?: boolean
    color?: ButtonColor
}

export interface ButtonBase {
    label: string
    id?: string
    interactionFct?: (interaction: Interaction, button: Button) => void
    option?: ButtonOption
}

export class Button extends MessageComponentBase implements MsgComponentInteractive {
    readonly id: string
    private _label: string
    interactionFct: (interaction: Interaction, button: Button) => void
    private _option: ButtonOption

    constructor(msgcOwner: MessageComponentBase, button: ButtonBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Button);
        this._label = button.label;
        this.interactionFct = button.interactionFct;

        if(button.id != undefined) {
            this.id = button.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId() + this._label;
            }
            else {
                this.id = this._label;
            }
        }

        // setup default option
        if(button.option==undefined) {
            this._option = {
                adminOnly: false,
                disable: false
            }
        }
        else {
            this._option = button.option;
            if(this._option.adminOnly == undefined) {
                this._option.adminOnly = false;
            }
            if(this._option.disable == undefined) {
                this._option.disable = false;
            }
            if(this._option.color == undefined) {
                this._option.color = ButtonColor.Black;
            }
        }

        // disable button if it has no interaction
        if(button.interactionFct==undefined) {
            this._option.disable = true;
        }
    }

    get option() {
        this.modified = true;
        return this._option;
    }
    get label() {
        this.modified = true;
        return this._label;
    }
    set label(l: string) {
        this.modified = true;
        this._label = l;
    }
    
    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.interactionFct = undefined;
    }
}