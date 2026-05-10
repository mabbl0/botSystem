import { Separator, TextMsgComponent } from "./basic-message-component";
import { ButtonRow } from "./button-row";
import { ButtonBase } from "./button";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentType } from "./message-component-type";
import { AccessoryButton } from "./accessory-button";
import { Message } from "../message";
import { MsgOption } from "../comm-type";
import { StringSelect, StringSelectBase } from "./string-select";
import { MentionableSelect, MentionSelectBase } from "./mentionable-select";

// TODO: update !click command

export class MessageComponent extends MessageComponentBase {
    msgComponents: MessageComponentBase[]
    readonly id: string
    private msgcCounter: number
    private _msgSent: Message
    msgOption: MsgOption
    private addMsgComponentInteraction: (msgComponentInteractives: MsgComponentInteractive[]) => void
    private removeMsgComponentInteraction: (msgComponentInteractives: MsgComponentInteractive[]) => void
    private adapterConstruct: new () => MsgComponentAdapterApi

    constructor(id: string, addMsgComponentInteraction?: (msgComponentInteractives: MsgComponentInteractive[]) => void, removeMsgComponentInteraction?: (msgComponentInteractives: MsgComponentInteractive[]) => void, adapterConstruct?: new () => MsgComponentAdapterApi, displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message) {
        super(undefined, displayType, MsgComponentType.MessageComponent);
        this.msgComponents = [];
        this.id = id;
        this.msgcCounter = 0;
        this.addMsgComponentInteraction = addMsgComponentInteraction;
        this.removeMsgComponentInteraction = removeMsgComponentInteraction;
        this.adapterConstruct = adapterConstruct;
        if(this.adapterConstruct != undefined) {
            this.adapter = new this.adapterConstruct();
        }
        this._msgSent = undefined;
        this.msgOption = {};
        this.interactiveComponents = [];
    }
    
    /**
     * Remove the reference to others object
     * @param notDeleteMsg indicate to not delete the message
     */
    override destroy(notDeleteMsg?: boolean) {
        if(this._msgSent && !notDeleteMsg) {
            this._msgSent.delete();
        }
        // remove the msg component with interaction from the manager
        if(this.removeMsgComponentInteraction) {
            this.removeMsgComponentInteraction(this.interactiveComponents);
        }
        
        this.msgComponents.forEach( msgC => {
            msgC.destroy();
        });
        this.msgComponents = undefined;
        this.addMsgComponentInteraction = undefined;
        this.removeMsgComponentInteraction = undefined;
    }


    set msgSent(msgSent: Message) {
        if(this._msgSent==undefined) { // only once
            this._msgSent = msgSent;
        }
    }
    get needMsg(): boolean {
        return this._msgSent == undefined;
    }

    /**
     * add a new message component
     * @param newMsgComponent the new message component to add
     * @returns the new message component added
     */
    private addNewMessageComponent<MsgComponentType extends MessageComponentBase>(newMsgComponent: MsgComponentType): MsgComponentType {
        this.msgComponents.push(newMsgComponent);
        if(this.adapterConstruct != undefined) {
            newMsgComponent.adapter = new this.adapterConstruct();
        }
        this.msgcCounter += 1;
        return newMsgComponent;
    }

    /**
     * add a new message component
     * @param newMsgComponent the new message component to add
     * @returns the new message component added
     */
    private addNewInteractiveMessageComponent<MsgComponentType extends MessageComponentBase>(newMsgComponent: MsgComponentType): MsgComponentType {
        newMsgComponent.interactiveComponents.forEach( iComponent => this.interactiveComponents.push(iComponent));
        return this.addNewMessageComponent(newMsgComponent);
    }

    /**
     * add a text to the message component
     * @param text text to add
     * @returns the new text message component created
     */
    addText(text: string): TextMsgComponent {
        return this.addNewMessageComponent(new TextMsgComponent(this, text, this.displayType));
    }

    /**
     * add a separator to the message component
     * @returns the new separator created
     */
    addSeparator(): Separator {
        return this.addNewMessageComponent(new Separator(this, this.displayType));
    }

    /**
     * add a row of button to the message component
     * @param buttons buttons to add
     * @returns the new row button created
     */
    addButtonRow(buttons: ButtonBase[]): ButtonRow {
        return this.addNewInteractiveMessageComponent(new ButtonRow(this, buttons, this.adapterConstruct, this.displayType));
    }

    /**
     * add a text with a accessory button
     * @param text text to add
     * @param button button to add
     * @returns the new accessory created
     */
    addAccessoryButton(text: string, button: ButtonBase): AccessoryButton {
        return this.addNewInteractiveMessageComponent(new AccessoryButton(this, text, button, this.adapterConstruct, this.displayType));
    }

    /**
     * add a string select to the message component
     * @param stringSelect the choices and the option to add
     * @returns the new string select created
     */
    addStringSelect(stringSelect: StringSelectBase): StringSelect {
        return this.addNewInteractiveMessageComponent(new StringSelect(this, stringSelect, this.displayType));
    }

    /**
     * add a mentionable select to the message component
     * @param mentionSelect option, interaction to add
     * @returns the new mentionable select created
     */
    addMentionableSelect(mentionSelect?: MentionSelectBase): MentionableSelect {
        return this.addNewInteractiveMessageComponent(new MentionableSelect(this, mentionSelect, this.displayType));
    }

    /**
     * Update the message
     */
    override update() {
        if(this._msgSent) {
            // adapt, if modified, the message component before to edit
            this.adapter?.adapt(this); 
            this._msgSent.edit(this);
        }
    }

    /**
     * adapt the message component to the api
     * @returns indicate if the message component is new
     */
    override adapt(): boolean {
        this.adapter?.adapt(this);
        return this.isNew;
    }

    /**
     * @returns a unique id for the message component
     */
    override getUniqueId(): string {
        return this.id + this.msgcCounter.toString();
    }

    /**
     * prepare the message component to be sent
     */
    prepareToSend() {
        // fisrt indicate and update the msg component with interaction
        if(this.addMsgComponentInteraction) {
            this.addMsgComponentInteraction(this.interactiveComponents);
        }
    }
}