import { CommInterface } from "../communication/comm-interface";
import { Interaction } from "../communication/interaction";
import { MessageComponent } from "../communication/message-component/message-component";


export class YesNoButtons<TArgs> {
    msgComponent: MessageComponent
    questionText: string
    args: TArgs

    yesCallback: (interaction: Interaction, args?: TArgs) => void
    noCallback: (interaction: Interaction, args?: TArgs) => void
    noAnswerCallback: (interaction: Interaction, args?: TArgs) => void

    // TODO: use noAnswerCallback

    constructor(commInterface: CommInterface, args?: TArgs) {
        this.msgComponent = commInterface.createMessageComponent();
        this.args = args;
    }

    msgToSend(): MessageComponent {
        if(this.yesCallback==undefined) {
            this.yesCallback = okReply;
        }
        if(this.noCallback==undefined) {
            this.noCallback = okReply;
        }
        if(this.noAnswerCallback==undefined) {
            this.noAnswerCallback = okReply;
        }

        if(this.questionText == undefined) {
            this.msgComponent.addText('are you sur?');
        }
        else {
            this.msgComponent.addText(this.questionText);
        }

        this.msgComponent.addButtonRow([
            {
                label: "yes",
                interactionFct: this.yesButton.bind(this)
            },
            {
                label: "non",
                interactionFct: this.noButton.bind(this)
            }
        ]);
        
        return this.msgComponent;
    }

    /** @internal */
    private yesButton(interaction: Interaction) {
        this.yesCallback(interaction, this.args);
    }
    /** @internal */
    private noButton(interaction: Interaction) {
        this.noCallback(interaction, this.args);
    }
}

function okReply(interaction: Interaction) {
    interaction.reply('ok');
}