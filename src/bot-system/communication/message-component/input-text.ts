import { Interaction } from "../interaction";
import { MessageComponentBase, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type";

interface InputTxtOption extends MsgComponentInteractiveOption {
    label: string
    minLength?: number
    maxLength?: number
    placeholder?: string
    multiLine?: boolean
    disable?: boolean
}

export interface InputTxtBase {
    option?: InputTxtOption
    id?: string
    interactionFct?: (interaction: Interaction, inputText: InputText) => void
}

export class InputText extends MessageComponentBase implements MsgComponentInteractive {
    readonly id: string
    interactionFct: (interaction: Interaction, inputText: InputText) => void
    #option: InputTxtOption

    /** @internal */
    constructor(msgcOwner: MessageComponentBase, inputText: InputTxtBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.InputText);

        this.interactionFct = inputText?.interactionFct;
        
        if(inputText?.id != undefined) {
            this.id = inputText?.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId();
            }
            else {
                this.id = 'inputTxt';
            }
        }

        // setup option
        if (inputText?.option == undefined) {
            this.#option = {
                label: 'input text',
                required: true,
                adminOnly: false
            }
        }
        else {
            this.#option = inputText?.option;
            if (this.#option.label == undefined) {
                this.#option.label = 'input text';
            }
            if (this.#option.required == undefined) {
                this.#option.required = true;
            }
            if (this.#option.adminOnly == undefined) {
                this.#option.adminOnly = false;
            }
        }

        if(this.#option.minLength > this.#option.maxLength) {
            this.#option.minLength = this.#option.maxLength;
        }
        // disable string select if it has no interaction
        if (this.interactionFct == undefined) {
            this.#option.disable = true;
        }

        this.interactiveComponents = [this];
    }

    get option() {
        this.modified = true;
        return this.#option;
    }
    
    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.interactiveComponents = undefined;
        this.interactionFct = undefined;
    }
}