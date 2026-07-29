import { Interaction } from "../communication/interaction";
import { MessageComponent } from "../communication/message-component/message-component";


export class YesNoButtons<TArgs> {
    /** the message component */
    msgComponent: MessageComponent
    /** the text question. 'are you sur?' by default */
    questionText: string
    /** the arguments for the callbacks */
    args: TArgs

    /** Callback when the user answered yes */
    yesCallback: (interaction: Interaction, args?: TArgs) => void
    /** Callback when the user answered no */
    noCallback: (interaction: Interaction, args?: TArgs) => void
    /** Callback if the user has not answered */
    noAnswerCallback: (args?: TArgs) => void

    /** indicate how many time have the user to answer. 10 min by default. in ms */
    answerDelay: number
    /** indicate if the user has answered
     *  @internal
    */
    private hasAnswered: boolean

    constructor(msgComponent: MessageComponent, args?: TArgs) {
        this.msgComponent = msgComponent;
        this.args = args;
        this.hasAnswered = false;

        this.answerDelay = 60_000_0; //10min
    }

    msgToSend(): MessageComponent {
        if(this.yesCallback==undefined) {
            this.yesCallback = okReply;
        }
        if(this.noCallback==undefined) {
            this.noCallback = okReply;
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


        // manage no answer case
        if(this.noAnswerCallback!=undefined) {
            setTimeout((ynButton) => {
                if(ynButton.hasAnswered) {
                    ynButton.noAnswerCallback(this.args)
                }
            }, this.answerDelay, this);
        }
        
        return this.msgComponent;
    }

    /** @internal */
    private yesButton(interaction: Interaction) {
        this.hasAnswered = true;
        this.yesCallback(interaction, this.args);
    }
    /** @internal */
    private noButton(interaction: Interaction) {
        this.hasAnswered = true;
        this.noCallback(interaction, this.args);
    }
}

function okReply(interaction: Interaction) {
    interaction.reply('ok');
}