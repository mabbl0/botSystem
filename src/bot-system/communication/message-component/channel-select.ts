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
    private _option: ChannelSelectOption

    
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
            this._option = {
                placeholder: undefined,
                minChoice: 1,
                maxChoice: 1,
                disable: false,
                adminOnly: false
            }
        }
        else {
            this._option = channelSelect?.option;
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