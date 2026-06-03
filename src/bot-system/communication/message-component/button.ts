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
    #label: string
    interactionFct: (interaction: Interaction, button: Button) => void
    #option: ButtonOption

    /** @internal */
    constructor(msgcOwner: MessageComponentBase, button: ButtonBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.Button);
        this.#label = button.label;
        this.interactionFct = button.interactionFct;

        if(button.id != undefined) {
            this.id = button.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId() + this.#label;
            }
            else {
                this.id = this.#label;
            }
        }

        // setup default option
        if(button.option==undefined) {
            this.#option = {
                adminOnly: false,
                disable: false
            }
        }
        else {
            this.#option = button.option;
            if(this.#option.adminOnly == undefined) {
                this.#option.adminOnly = false;
            }
            if(this.#option.disable == undefined) {
                this.#option.disable = false;
            }
            if(this.#option.color == undefined) {
                this.#option.color = ButtonColor.Black;
            }
        }

        // disable button if it has no interaction
        if(button.interactionFct==undefined) {
            this.#option.disable = true;
        }
    }

    get option() {
        this.modified = true;
        return this.#option;
    }
    get label() {
        this.modified = true;
        return this.#label;
    }
    set label(l: string) {
        this.modified = true;
        this.#label = l;
    }
    
    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.interactionFct = undefined;
    }
}