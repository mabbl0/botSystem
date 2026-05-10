import { Interaction } from "../interaction";
import { MessageComponentBase, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type";

export interface StringSelectChoice {
    label: string
    value?: any
    description?: string
    emoji?: string
    isByDefault?: boolean
}

interface StringSelectOption extends MsgComponentInteractiveOption {
    disable?: boolean
    placeholder?: string
    minChoice?: number
    maxChoice?: number
}

export interface StringSelectBase {
    choices: StringSelectChoice[]
    option?: StringSelectOption
    id?: string
    interactionFct?: (interaction: Interaction, stringSelect: StringSelect) => void
}

export class StringSelect extends MessageComponentBase implements MsgComponentInteractive {
    readonly id: string
    interactionFct: (interaction: Interaction, stringSelect: StringSelect) => void
    private _option: StringSelectOption

    private _choices: StringSelectChoice[]
    
    constructor(msgcOwner: MessageComponentBase, strSelect: StringSelectBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.StringSelect);

        this.id = strSelect.id;
        this.interactionFct = strSelect.interactionFct;
        this._choices = strSelect.choices;
        
        if(strSelect.id != undefined) {
            this.id = strSelect.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId();
            }
            else {
                this.id = 'strSelect';
            }
        }

        // setup option
        if (strSelect.option == undefined) {
            this._option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this._option = strSelect.option;
            if (this._option.minChoice == undefined) {
                this._option.minChoice = 1;
            }
            if (this._option.maxChoice == undefined) {
                this._option.maxChoice = 1;
            }
            if (this._option.disable == undefined) {
                this._option.disable = false;
            }
            if (this._option.adminOnly == undefined) {
                this._option.adminOnly = false;
            }
        }

        if(this._option.minChoice > this._option.maxChoice) {
            this._option.minChoice = this._option.maxChoice;
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
    get choices() {
        this.modified = true;
        return this._choices;
    }
    set choices(c: StringSelectChoice[]) {
        this.modified = true;
        this._choices = c;
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