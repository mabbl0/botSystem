import { Interaction } from "../interaction";

// Message Component Type
export const enum MsgComponentType {
    MessageComponent,
    
    Text,
    Separator,
    ButtonRow,
    Button,
    AccessoryButton,
    StringSelect,
    MentionableSelect,
    ChannelSelect,
    InputText,

    Unknow
}

export const enum MsgComponentDisplayType {
    Message,
    Modal,
    Unknow
}

// class interface for the message component class
export abstract class MessageComponentBase {
    readonly type: MsgComponentType
    protected _displayType: MsgComponentDisplayType
    protected msgcOwner: MessageComponentBase
    protected modified: boolean
    protected isNew: boolean
    adapter: MsgComponentAdapterApi
    interactiveComponents: MsgComponentInteractive[]
    
    constructor(msgcOwner: MessageComponentBase, displayType: MsgComponentDisplayType, type: MsgComponentType) {
        this.type = type;
        this._displayType = displayType;
        this.msgcOwner = msgcOwner;
        this.modified = true;
        this.isNew = true;
    }

    /**
     * Remove the reference to others object
     */
    destroy() {
        this.msgcOwner = undefined;
    }
    
    update() {
        // msgc adapt will be call the owner component
        // this.adapt();
        this.msgcOwner?.update();
    }

    get hasBeenModified() {
        return this.modified;
    }
    get displayType() {
        return this._displayType
    }

    /**
     * adapt the message component to the api
     * @returns indicate if the message component is new
     */
    adapt(): boolean {
        if(this.modified) {
            this.adapter?.adapt(this);
            this.modified = false;
        }
        if(this.isNew) {
            this.isNew = false;
            return true;
        }
        return false;
    }
    
    getUniqueId?(): string
}


/*** Message Component Interaction ***/

// message component json format base for the api
export interface MsgComponentInteractiveJson {
    id: string
}

// option for a message component with an interaction
export interface MsgComponentInteractiveOption {
    adminOnly?: boolean
    required?: boolean
}

// interaction with a msg component
export interface MsgComponentInteractive {
    id: string
    interactionFct: (interaction: Interaction, msgci: MsgComponentInteractive) => void
    option: MsgComponentInteractiveOption
}


/**** Message Component Adapter Api ***/

export interface MsgComponentAdapterApi {
    adapt(msgc: MessageComponentBase): void
}