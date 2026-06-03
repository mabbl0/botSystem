import { Interaction } from "../interaction";
import { MessageComponentBase, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type";

interface MentionSelectOption extends MsgComponentInteractiveOption {
    disable?: boolean
    placeholder?: string
    minChoice?: number
    maxChoice?: number
}

export interface MentionSelectBase {
    option?: MentionSelectOption
    id?: string
    interactionFct?: (interaction: Interaction, mentionSelect: MentionableSelect) => void
}

export class MentionableSelect extends MessageComponentBase implements MsgComponentInteractive {
    readonly id: string
    interactionFct: (interaction: Interaction, mentionSelect: MentionableSelect) => void
    #option: MentionSelectOption

    
    /** @internal */
    constructor(msgcOwner: MessageComponentBase, mentionSelect?: MentionSelectBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.MentionableSelect);

        this.interactionFct = mentionSelect?.interactionFct;
        
        if(mentionSelect?.id != undefined) {
            this.id = mentionSelect?.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId();
            }
            else {
                this.id = 'mentionSelect';
            }
        }

        // setup option
        if (mentionSelect?.option == undefined) {
            this.#option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this.#option = mentionSelect?.option;
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

    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.interactiveComponents = undefined;
        this.interactionFct = undefined;
    }
}