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
    private _option: MentionSelectOption

    
    constructor(msgcOwner: MessageComponentBase, mentionSelect?: MentionSelectBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.MentionableSelect);

        this.id = mentionSelect?.id;
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
            this._option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this._option = mentionSelect?.option;
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

    /**
     * Remove the reference to others object
     */
    override destroy() {
        super.destroy();
        this.interactiveComponents = undefined;
        this.interactionFct = undefined;
    }
}