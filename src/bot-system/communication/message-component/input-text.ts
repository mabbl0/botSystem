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
    private _option: InputTxtOption

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
            this._option = {
                label: 'input text',
                required: true,
                adminOnly: false
            }
        }
        else {
            this._option = inputText?.option;
            if (this._option.label == undefined) {
                this._option.label = 'input text';
            }
            if (this._option.required == undefined) {
                this._option.required = true;
            }
            if (this._option.adminOnly == undefined) {
                this._option.adminOnly = false;
            }
        }

        if(this._option.minLength > this._option.maxLength) {
            this._option.minLength = this._option.maxLength;
        }
        // disable string select if it has no interaction
        if (this.interactionFct == undefined) {
            this._option.disable = true;
        }

        this.interactiveComponents = [this];
    }

    get option() {
        this.modified = true;
        return this._option;
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