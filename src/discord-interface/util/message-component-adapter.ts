import Discord from "discord.js";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentType } from "../../bot-system/communication/message-component/message-component-type";
import { Button, ButtonColor } from "../../bot-system/communication/message-component/button";
import { ButtonRow } from "../../bot-system/communication/message-component/button-row";
import { TextMsgComponent } from "../../bot-system/communication/message-component/basic-message-component";
import { AccessoryButton } from "../../bot-system/communication/message-component/accessory-button";
import { StringSelect } from "../../bot-system/communication/message-component/string-select";
import { MessageComponent } from "../../bot-system/communication/message-component/message-component";
import { MentionableSelect } from "../../bot-system/communication/message-component/mentionable-select";

type DiscordMsgComponentData = Discord.TopLevelComponentData | Discord.MessageActionRowComponentData | DiscordMsgComponentData[];
type DiscordActionRowData = Discord.ActionRowData<Discord.MessageActionRowComponentData>;

interface MsgcToAdd<DataType> {
    msgcs: DataType[]
    indexNewToAdd: number
}

// https://docs.discord.com/developers/components/reference#component-object-component-types

export class MsgComponentAdapter implements MsgComponentAdapterApi {
    msgcAdapted: DiscordMsgComponentData
    msgcToAdd: MsgcToAdd<DiscordMsgComponentData>

    adapt(msgc: MessageComponentBase): void {
        if (this.msgcAdapted == undefined && msgc.type != MsgComponentType.MessageComponent) {
            this.msgcAdapted = {
                type: adaptMsgComponentType(msgc.type)
            };
        }

        switch (msgc.type) {
            case MsgComponentType.MessageComponent:
                this.msgcAdapted = adaptMessageComponent(msgc as MessageComponent, this.msgcAdapted as DiscordMsgComponentData[]);
                break;
            case MsgComponentType.Text:
                adaptText(msgc as TextMsgComponent, this.msgcAdapted as Discord.TextDisplayComponentData);
                break;
            case MsgComponentType.Separator:
                break;
            case MsgComponentType.ButtonRow:
                if(this.msgcToAdd == undefined) {
                    this.msgcToAdd = {msgcs: [], indexNewToAdd: 0};
                }
                adaptButtonRow((msgc as ButtonRow).buttons, this.msgcAdapted as Discord.ActionRowData<Discord.ButtonComponentData>, this.msgcToAdd as MsgcToAdd<DiscordActionRowData>);
                break;
            case MsgComponentType.StringSelect:
                adaptStringSelect(msgc as StringSelect, this.msgcAdapted as DiscordActionRowData);
                break;
            case MsgComponentType.MentionableSelect:
                adaptMentionableSelect(msgc as MentionableSelect, this.msgcAdapted as DiscordActionRowData);
                break;
            case MsgComponentType.Button:
                adaptButton(msgc as Button, this.msgcAdapted as Discord.InteractionButtonComponentData);
                break;
            case MsgComponentType.AccessoryButton:
                adaptAccessoryButton(msgc as AccessoryButton, this.msgcAdapted as Discord.SectionComponentData);
                break;
        }
    }
}


/*** Adapt each message component use ***/

// Message Component
function adaptMessageComponent(msgc: MessageComponent, msgcAdapted: DiscordMsgComponentData[]): DiscordMsgComponentData[] {
    if (msgcAdapted == undefined) {
        msgcAdapted = [];
        msgc.msgComponents.forEach(msgcChildren => {
            msgcChildren.adapt();
            msgcAdapted.push((msgcChildren.adapter as MsgComponentAdapter).msgcAdapted);
            (msgcChildren.adapter as MsgComponentAdapter).msgcToAdd?.msgcs.forEach(msgcAdd =>
                msgcAdapted.push(msgcAdd)
            );
        });
    }
    else {
        for (let i = 0; i < msgc.msgComponents.length; i++) {
            if (msgc.msgComponents[i].adapt()) {
                // is a new component, need to be add
                msgcAdapted.splice(i, 0, (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcAdapted);
            }

            if((msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd != undefined) {
                (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.msgcs.forEach((msgcAdd, j) => {
                    if(j >= (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.indexNewToAdd) {
                        msgcAdapted.splice(i +1 +j, 0, msgcAdd);
                    }
                });
                (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.indexNewToAdd = (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.msgcs.length;
            }
        }
    }
    return msgcAdapted;
}

// Text Message Component
function adaptText(msgc: TextMsgComponent, msgcAdapted: Discord.TextDisplayComponentData) {
    msgcAdapted.content = msgc.text;
}

// Button Row
function adaptButtonRow(buttons: Button[], msgcAdapted: Discord.ActionRowData<Discord.ButtonComponentData>, msgcToAdd: MsgcToAdd<DiscordActionRowData>) {
    if(msgcAdapted.components == undefined) {
        msgcAdapted.components = [];
    }

    buttons.forEach( (button, i) => {
        if(i<5) {
            if(button.adapt()) {
                (msgcAdapted.components as Discord.ButtonComponentData[]).push((button.adapter as MsgComponentAdapter).msgcAdapted as Discord.ButtonComponentData);
            }
        }
        else {
            let msgcToAddIndex = Math.floor(i/5) -1;
            if(msgcToAddIndex >= msgcToAdd.msgcs.length) {
                msgcToAdd.msgcs.push({
                    type: Discord.ComponentType.ActionRow,
                    components: []
                });
            }

            if(button.adapt()) {
                (msgcToAdd.msgcs[msgcToAddIndex].components as Discord.ButtonComponentData[]).push((button.adapter as MsgComponentAdapter).msgcAdapted as Discord.ButtonComponentData);
            }
        }
    });
}


function adaptButton(button: Button, msgcAdapted: Discord.InteractionButtonComponentData) {
    msgcAdapted.style = adaptButtonColor(button.option?.color);
    msgcAdapted.customId = button.id;
    msgcAdapted.disabled = button.option?.disable;
    if (button.label.length > 80) {
        msgcAdapted.label = button.label.slice(0, 80);
    }
    else {
        msgcAdapted.label = button.label;
    }
}

function adaptButtonColor(buttonColor: ButtonColor): Exclude<Discord.ButtonStyle, Discord.ButtonStyle.Link> {
    switch (buttonColor) {
        default:
        case ButtonColor.Black:
            return Discord.ButtonStyle.Secondary;
        case ButtonColor.Red:
            return Discord.ButtonStyle.Danger;
        case ButtonColor.Green:
            return Discord.ButtonStyle.Success;
        case ButtonColor.Blue:
            return Discord.ButtonStyle.Primary;
    }
}


// adapt Button Accesory
function adaptAccessoryButton(accessoryButton: AccessoryButton, msgcAdapted: Discord.SectionComponentData) {
    msgcAdapted.components = [{
        type: Discord.ComponentType.TextDisplay,
        content: accessoryButton.text
    }];
    accessoryButton.button.adapt();
    msgcAdapted.accessory = (accessoryButton.button.adapter as MsgComponentAdapter).msgcAdapted as Discord.InteractionButtonComponentData;
}


// string select
function adaptStringSelect(strSelect: StringSelect, msgcAdapted: DiscordActionRowData) {
    msgcAdapted.components = [{
        type: Discord.ComponentType.StringSelect,
        customId: strSelect.id,
        disabled: strSelect.option?.disable,
        placeholder: strSelect.option?.placeholder,
        minValues: strSelect.option?.minChoice,
        maxValues: strSelect.option?.maxChoice,
        options: strSelect.choices as any
    }];
    (msgcAdapted.components[0] as Discord.StringSelectMenuComponentData).options.forEach(opt => {
        if (opt.value == undefined) {
            opt.value = opt.label;
        }
        opt.default = (opt as any).isByDefault;
    });
}


// mentionable select
function adaptMentionableSelect(mentionSelect: MentionableSelect, msgcAdapted: DiscordActionRowData) {
    msgcAdapted.components = [{
        type: Discord.ComponentType.MentionableSelect,
        customId: mentionSelect.id,
        disabled: mentionSelect.option?.disable,
        placeholder: mentionSelect.option?.placeholder,
        minValues: mentionSelect.option?.minChoice,
        maxValues: mentionSelect.option?.maxChoice
    }];
}



function adaptMsgComponentType(bsType: MsgComponentType): Discord.ComponentType {
    switch (bsType) {
        case MsgComponentType.Text:
            return Discord.ComponentType.TextDisplay;
        case MsgComponentType.Separator:
            return Discord.ComponentType.Separator;
        case MsgComponentType.ButtonRow:
        case MsgComponentType.StringSelect:
        case MsgComponentType.MentionableSelect:
            return Discord.ComponentType.ActionRow;
        case MsgComponentType.Button:
            return Discord.ComponentType.Button;
        case MsgComponentType.AccessoryButton:
            return Discord.ComponentType.Section;
        default:
            return undefined;
    }
}