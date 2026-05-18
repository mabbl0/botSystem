import Discord from "discord.js";
import { MessageComponentBase, MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentType } from "../../bot-system/communication/message-component/message-component-type";
import { Button, ButtonColor } from "../../bot-system/communication/message-component/button";
import { ButtonRow } from "../../bot-system/communication/message-component/button-row";
import { Separator, TextMsgComponent } from "../../bot-system/communication/message-component/basic-message-component";
import { AccessoryButton } from "../../bot-system/communication/message-component/accessory-button";
import { StringSelect } from "../../bot-system/communication/message-component/string-select";
import { MessageComponent } from "../../bot-system/communication/message-component/message-component";
import { MentionableSelect } from "../../bot-system/communication/message-component/mentionable-select";
import { InputText } from "../../bot-system/communication/message-component/input-text";
import { InteractionCore } from "../../bot-system/communication/interaction";
import { ChannelSelect } from "../../bot-system/communication/message-component/channel-select";

type DiscordMsgComponentData = Discord.TopLevelComponentData | Discord.MessageActionRowComponentData | DiscordMsgComponentData[];
type DiscordActionRowData = Discord.ActionRowData<Discord.MessageActionRowComponentData>;

interface MsgcToAdd<DataType> {
    msgcs: DataType[]
    indexNewToAdd: number
}

// https://docs.discord.com/developers/components/reference#component-object-component-types

// TODO: label modal [1-45]

export class MsgComponentAdapter implements MsgComponentAdapterApi {
    static InputTxtAdaptCount: number = 0
    msgcAdapted: DiscordMsgComponentData
    msgcToAdd: MsgcToAdd<DiscordMsgComponentData>

    adapt(msgc: MessageComponentBase): void {
        if (this.msgcAdapted == undefined && msgc.type != MsgComponentType.MessageComponent) {
            this.msgcAdapted = {
                type: adaptMsgComponentType(msgc.type, msgc.displayType)
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
                adaptSeparator(msgc as Separator, this.msgcAdapted);
                break;
            case MsgComponentType.ButtonRow:
                this.msgcToAdd = adaptButtonRow(msgc as ButtonRow, this.msgcAdapted as Discord.ActionRowData<Discord.ButtonComponentData>, this.msgcToAdd as MsgcToAdd<DiscordActionRowData>);
                break;
            case MsgComponentType.StringSelect:
                adaptStringSelect(msgc as StringSelect, this.msgcAdapted as DiscordActionRowData | Discord.LabelComponentData);
                break;
            case MsgComponentType.MentionableSelect:
                adaptMentionableSelect(msgc as MentionableSelect, this.msgcAdapted as DiscordActionRowData | Discord.LabelComponentData);
                break;
            case MsgComponentType.ChannelSelect:
                adaptChannelSelect(msgc as ChannelSelect, this.msgcAdapted as DiscordActionRowData | Discord.LabelComponentData);
                break;
            case MsgComponentType.Button:
                adaptButton(msgc as Button, this.msgcAdapted as Discord.InteractionButtonComponentData);
                break;
            case MsgComponentType.AccessoryButton:
                adaptAccessoryButton(msgc as AccessoryButton, this.msgcAdapted as Discord.SectionComponentData);
                break;
            case MsgComponentType.InputText:
                adaptInputText(msgc as InputText, this.msgcAdapted as DiscordActionRowData | Discord.LabelComponentData);
                break;
        }
    }
}


/*** Adapt each message component use ***/

// Message Component
function adaptMessageComponent(msgc: MessageComponent, msgcAdapted: DiscordMsgComponentData[]): DiscordMsgComponentData[] {
    // TODO: Modal no more than 5
    if (msgcAdapted == undefined) {
        msgcAdapted = [];
        msgc.msgComponents.forEach(msgcChildren => {
            msgcChildren.adapt();
            if((msgcChildren.adapter as MsgComponentAdapter).msgcAdapted != undefined) {
                msgcAdapted.push((msgcChildren.adapter as MsgComponentAdapter).msgcAdapted);
                (msgcChildren.adapter as MsgComponentAdapter).msgcToAdd?.msgcs.forEach(msgcAdd =>
                    msgcAdapted.push(msgcAdd)
                );
            }
        });
    }
    else {
        for (let i = 0; i < msgc.msgComponents.length; i++) {
            if (msgc.msgComponents[i].adapt()) {
                // is a new component, need to be add
                if((msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcAdapted != undefined) {
                    msgcAdapted.splice(i, 0, (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcAdapted);
                }
            }

            if ((msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd != undefined) {
                (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.msgcs.forEach((msgcAdd, j) => {
                    if (j >= (msgc.msgComponents[i].adapter as MsgComponentAdapter).msgcToAdd.indexNewToAdd) {
                        msgcAdapted.splice(i + 1 + j, 0, msgcAdd);
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

// Separator
function adaptSeparator(msgc: Separator, _msgcAdapted: DiscordMsgComponentData) {
    if (msgc.displayType == MsgComponentDisplayType.Modal) {
        _msgcAdapted = undefined; // no button adaptation for discord modal
    }
}

// Button Row
function adaptButtonRow(buttonRow: ButtonRow, msgcAdapted: Discord.ActionRowData<Discord.ButtonComponentData>, msgcToAdd: MsgcToAdd<DiscordActionRowData>): MsgcToAdd<DiscordActionRowData> {
    if (buttonRow.displayType == MsgComponentDisplayType.Modal) {
        msgcAdapted = undefined; // no button adaptation for discord modal
        return undefined;
    }

    if (msgcToAdd == undefined) {
        msgcToAdd = { msgcs: [], indexNewToAdd: 0 };
    }
    if (msgcAdapted.components == undefined) {
        msgcAdapted.components = [];
    }

    buttonRow.buttons.forEach((button, i) => {
        if (i < 5) {
            if (button.adapt()) {
                (msgcAdapted.components as Discord.ButtonComponentData[]).push((button.adapter as MsgComponentAdapter).msgcAdapted as Discord.ButtonComponentData);
            }
        }
        else {
            let msgcToAddIndex = Math.floor(i / 5) - 1;
            if (msgcToAddIndex >= msgcToAdd.msgcs.length) {
                msgcToAdd.msgcs.push({
                    type: Discord.ComponentType.ActionRow,
                    components: []
                });
            }

            if (button.adapt()) {
                (msgcToAdd.msgcs[msgcToAddIndex].components as Discord.ButtonComponentData[]).push((button.adapter as MsgComponentAdapter).msgcAdapted as Discord.ButtonComponentData);
            }
        }
    });
    return msgcToAdd;
}


function adaptButton(button: Button, msgcAdapted: Discord.InteractionButtonComponentData) {
    if (button.displayType == MsgComponentDisplayType.Modal) {
        msgcAdapted = undefined; // no button adaptation for discord modal
        return;
    }

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
function adaptAccessoryButton(accessoryButton: AccessoryButton, msgcAdapted: Discord.SectionComponentData | Discord.TextDisplayComponentData) {
    if(accessoryButton.displayType == MsgComponentDisplayType.Message) {
        (msgcAdapted as Discord.SectionComponentData).components = [{
            type: Discord.ComponentType.TextDisplay,
            content: accessoryButton.text
        }];
        accessoryButton.button.adapt();
        (msgcAdapted as Discord.SectionComponentData).accessory = (accessoryButton.button.adapter as MsgComponentAdapter).msgcAdapted as Discord.InteractionButtonComponentData;
    }
    else {
        // MODAL -> no button, so only text
        (msgcAdapted as Discord.TextDisplayComponentData).content = accessoryButton.text;
    }
}


// string select
function adaptStringSelect(strSelect: StringSelect, msgcAdapted: DiscordActionRowData | Discord.LabelComponentData) {
    if(strSelect.displayType == MsgComponentDisplayType.Message) {
        (msgcAdapted as DiscordActionRowData).components = [{
            type: Discord.ComponentType.StringSelect,
            customId: strSelect.id,
            disabled: strSelect.option?.disable,
            placeholder: strSelect.option?.placeholder,
            minValues: strSelect.option?.minChoice,
            maxValues: strSelect.option?.maxChoice,
            options: strSelect.choices as any
        }];
        ((msgcAdapted as DiscordActionRowData).components[0] as Discord.StringSelectMenuComponentData).options.forEach(opt => {
            if (opt.value == undefined) {
                opt.value = opt.label;
            }
            opt.default = (opt as any).isByDefault;
        });
    }
    else {
        // Modal
        (msgcAdapted as Discord.LabelComponentData).component = {
            type: Discord.ComponentType.StringSelect,
            customId: strSelect.id,
            required: strSelect.option?.required as any,
            placeholder: strSelect.option?.placeholder,
            minValues: strSelect.option?.minChoice,
            maxValues: strSelect.option?.maxChoice,
            options: strSelect.choices as any
        };
        ((msgcAdapted as Discord.LabelComponentData).component as Discord.StringSelectMenuComponentData).options.forEach(opt => {
            if (opt.value == undefined) {
                opt.value = opt.label;
            }
            opt.default = (opt as any).isByDefault;
        });

        (msgcAdapted as Discord.LabelComponentData).label = 
            strSelect.option?.placeholder != undefined ? 
            strSelect.option?.placeholder : 'string choice?';
    }
}

// mentionable select
function adaptMentionableSelect(mentionSelect: MentionableSelect, msgcAdapted: DiscordActionRowData | Discord.LabelComponentData) {
    if(mentionSelect.displayType == MsgComponentDisplayType.Message) {
        (msgcAdapted as DiscordActionRowData).components = [{
            type: Discord.ComponentType.MentionableSelect,
            customId: mentionSelect.id,
            disabled: mentionSelect.option?.disable,
            placeholder: mentionSelect.option?.placeholder,
            minValues: mentionSelect.option?.minChoice,
            maxValues: mentionSelect.option?.maxChoice
        }];
    }
    else {
        // MODAL
        (msgcAdapted as Discord.LabelComponentData).component = {
            type: Discord.ComponentType.MentionableSelect,
            customId: mentionSelect.id,
            required: mentionSelect.option?.required as any,
            placeholder: mentionSelect.option?.placeholder,
            minValues: mentionSelect.option?.minChoice,
            maxValues: mentionSelect.option?.maxChoice
        };
        (msgcAdapted as Discord.LabelComponentData).label = 
            mentionSelect.option?.placeholder != undefined ? 
            mentionSelect.option?.placeholder : 'mention choice?';
    }
}

// mentionable select
function adaptChannelSelect(channelSelect: ChannelSelect, msgcAdapted: DiscordActionRowData | Discord.LabelComponentData) {
    if(channelSelect.displayType == MsgComponentDisplayType.Message) {
        (msgcAdapted as DiscordActionRowData).components = [{
            type: Discord.ComponentType.ChannelSelect,
            customId: channelSelect.id,
            disabled: channelSelect.option?.disable,
            placeholder: channelSelect.option?.placeholder,
            minValues: channelSelect.option?.minChoice,
            maxValues: channelSelect.option?.maxChoice,
            channelTypes: [Discord.ChannelType.GuildText]
        }];
    }
    else {
        // MODAL
        (msgcAdapted as Discord.LabelComponentData).component = {
            type: Discord.ComponentType.ChannelSelect,
            customId: channelSelect.id,
            required: channelSelect.option?.required as any,
            placeholder: channelSelect.option?.placeholder,
            minValues: channelSelect.option?.minChoice,
            maxValues: channelSelect.option?.maxChoice,
            channelTypes: [Discord.ChannelType.GuildText]
        };
        (msgcAdapted as Discord.LabelComponentData).label = 
            channelSelect.option?.placeholder != undefined ? 
            channelSelect.option?.placeholder : 'channel choice?';
    }
}

// input text
function adaptInputText(inputText: InputText, msgcAdapted: DiscordActionRowData | Discord.LabelComponentData) {
    // input text is only available for Modal
    // for messageComponent display => create a button to send a modal
    if(inputText.option?.label.length > 45) {
        inputText.option.label = inputText.option.label.slice(0,45);
    }
    
    if(inputText.displayType == MsgComponentDisplayType.Modal) {
        (msgcAdapted as Discord.LabelComponentData).component = {
            type: Discord.ComponentType.TextInput,
            customId: inputText.id,
            required: inputText.option?.required as any,
            placeholder: inputText.option?.placeholder,
            style: inputText.option?.multiLine ? Discord.TextInputStyle.Paragraph : Discord.TextInputStyle.Short
        } as any;
        (msgcAdapted as Discord.LabelComponentData).label = 
            inputText.option?.label != undefined ? 
            inputText.option?.label : 'input text';
    }
    else {
        // Message display
        // prepare the button to send
        let buttonInputTxtId = 'InputTxtAdapt' + MsgComponentAdapter.InputTxtAdaptCount;
        (msgcAdapted as DiscordActionRowData).components = [{
            type: Discord.ComponentType.Button,
            label: inputText.option?.label != undefined ? inputText.option?.label : 'input text',
            customId: buttonInputTxtId,
            style: Discord.ButtonStyle.Primary
        }];

        // add to the messageComponent owner a fictive interactive component button
        ((inputText as any).msgcOwner as MessageComponent).interactiveComponents.push(
            new Button(undefined, {
                label: inputText.option?.label != undefined ? inputText.option?.label : 'input text',
                id: buttonInputTxtId,
                option: {color: ButtonColor.Blue},
                interactionFct: (interaction: InteractionCore) => {
                    // user click an the button
                    // send the modal with the id of the input text
                    (interaction.interactApi as Discord.ButtonInteraction).showModal({
                        customId: inputText.id,
                        title: 'modal',
                        components: [{
                            type: Discord.ComponentType.Label,
                            label: inputText.option?.label != undefined ? inputText.option?.label : 'input text',
                            component: {
                                type: Discord.ComponentType.TextInput,
                                customId: inputText.id,
                                required: inputText.option?.required as any,
                                placeholder: inputText.option?.placeholder,
                                style: inputText.option?.multiLine ? Discord.TextInputStyle.Paragraph : Discord.TextInputStyle.Short
                            } as any
                        }]
                    });
                }
            }
        ));
        MsgComponentAdapter.InputTxtAdaptCount += 1;
    }
}




function adaptMsgComponentType(bsType: MsgComponentType, displayType: MsgComponentDisplayType): Discord.ComponentType {
    switch (bsType) {
        case MsgComponentType.Text:
            return Discord.ComponentType.TextDisplay;
        case MsgComponentType.Separator:
            return Discord.ComponentType.Separator;
        case MsgComponentType.ButtonRow:
        case MsgComponentType.StringSelect:
        case MsgComponentType.MentionableSelect:
        case MsgComponentType.ChannelSelect:
        case MsgComponentType.InputText:
            if(displayType == MsgComponentDisplayType.Message) {
                return Discord.ComponentType.ActionRow;
            }
            else {
                return Discord.ComponentType.Label;
            }
        case MsgComponentType.Button:
            return Discord.ComponentType.Button;
        case MsgComponentType.AccessoryButton:
            if(displayType == MsgComponentDisplayType.Message) {
                return Discord.ComponentType.Section;
            }
            else {
                return Discord.ComponentType.TextDisplay;
            }
        default:
            return undefined;
    }
}

