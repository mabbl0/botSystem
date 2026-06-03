import { Interaction } from "../interaction";
import { MessageComponentBase, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type";

interface ChannelSelectOption extends MsgComponentInteractiveOption {
    disable?: boolean
    placeholder?: string
    minChoice?: number
    maxChoice?: number
}

export interface ChannelSelectBase {
    option?: ChannelSelectOption
    id?: string
    interactionFct?: (interaction: Interaction, channelSelect: ChannelSelect) => void
}

export class ChannelSelect extends MessageComponentBase implements MsgComponentInteractive {
    readonly id: string
    interactionFct: (interaction: Interaction, channelSelect: ChannelSelect) => void
    #option: ChannelSelectOption
    
    /** @internal */
    constructor(msgcOwner: MessageComponentBase, channelSelect?: ChannelSelectBase, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(msgcOwner, displayType, MsgComponentType.ChannelSelect);

        this.interactionFct = channelSelect?.interactionFct;
        
        if(channelSelect?.id != undefined) {
            this.id = channelSelect?.id;
        }
        else {
            if(this.msgcOwner.getUniqueId != undefined) {
                this.id = this.msgcOwner.getUniqueId();
            }
            else {
                this.id = 'channelSelect';
            }
        }

        // setup option
        if (channelSelect?.option == undefined) {
            this.#option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this.#option = channelSelect?.option;
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