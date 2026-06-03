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
    #option: StringSelectOption
    #choices: StringSelectChoice[]
    
    /** @internal */
    constructor(msgcOwner: MessageComponentBase, strSelect: StringSelectBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.StringSelect);

        this.id = strSelect.id;
        this.interactionFct = strSelect.interactionFct;
        this.#choices = strSelect.choices;
        
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
            this.#option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this.#option = strSelect.option;
            if (this.#option.minChoice == undefined) {
                this.#option.minChoice = 1;
            }
            if (this.#option.maxChoice == undefined) {
                this.#option.maxChoice = 1;
            }
            if (this.#option.disable == undefined) {
                this.#option.disable = false;
            }
            if (this.#option.adminOnly == undefined) {
                this.#option.adminOnly = false;
            }
        }

        if(this.#option.minChoice > this.#option.maxChoice) {
            this.#option.minChoice = this.#option.maxChoice;
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
    get choices() {
        this.modified = true;
        return this.#choices;
    }
    set choices(c: StringSelectChoice[]) {
        this.modified = true;
        this.#choices = c;
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