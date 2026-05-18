import { Interaction } from "../interaction";
import { MessageComponent } from "./message-component";
import { MsgComponentAdapterApi, MsgComponentDisplayType, MsgComponentInteractive, MsgComponentInteractiveOption, MsgComponentType } from "./message-component-type";

export interface ModalBase {
    interactionFct: (interaction: Interaction, modal: Modal) => void
    option?: MsgComponentInteractiveOption
}

export interface ModalChoiceData {
    type: MsgComponentType,
    id: string,
    choice: any
}

interface TypeChoiceIndication {type: MsgComponentType}
interface ComponentChoiceIndication {component: MsgComponentInteractive}
interface IdChoiceIndication {id: string}
interface IndexChoiceIndication {index: number}
type ChoiceIndication = TypeChoiceIndication | ComponentChoiceIndication | IdChoiceIndication | IndexChoiceIndication;

export class Modal extends MessageComponent implements MsgComponentInteractive {
    interactionFct: (interaction: Interaction, msgci: MsgComponentInteractive) => void
    option: MsgComponentInteractiveOption

    constructor(id: string, modal: ModalBase, addMsgComponentInteraction?: (msgComponentInteractives: MsgComponentInteractive[]) => void, removeMsgComponentInteraction?: (msgComponentInteractives: MsgComponentInteractive[]) => void, adapterConstruct?: new () => MsgComponentAdapterApi) {
        super(id, addMsgComponentInteraction, removeMsgComponentInteraction, adapterConstruct);
        this._displayType = MsgComponentDisplayType.Modal;

        this.option = modal.option;
        this.interactionFct = modal.interactionFct;
        this.interactiveComponents.push(this);
    }

    /**
     * all the choice after modal submit
     * @param interaction interaction received
     * @returns all component choices
     */
    getChoices(interaction: Interaction): ModalChoiceData[] {
        return interaction.getChoice<ModalChoiceData[]>([]);
    }

    /**
     * choice of a wanted component in the modal
     * @param interaction interaction received
     * @param componentIndication indication to find the choice of the wanted component
     * @param defaultChoice default choice for the wanted component
     * @returns wanted component choice
     */
    get1Choice<ChoiceType>(interaction: Interaction, componentIndication: ChoiceIndication, defaultChoice: ChoiceType): ChoiceType {
        let choicesArr = interaction.getChoice<ModalChoiceData[]>([]);
        
        if((componentIndication as TypeChoiceIndication).type != undefined) {
            // research by type
            for (let i = 0; i < choicesArr.length; i++) {
                if(choicesArr[i].type == (componentIndication as TypeChoiceIndication).type) {
                    if(choicesArr[i].choice != undefined) {
                        return choicesArr[i].choice;
                    }
                    return defaultChoice;
                }   
            }
            return defaultChoice;
        }
        
        let idComponent: string = undefined;
        if((componentIndication as IndexChoiceIndication).index != undefined) {
            // research by index
            if((componentIndication as IndexChoiceIndication).index < 0 || (componentIndication as IndexChoiceIndication).index >= this.msgComponents.length) {
                return defaultChoice;
            }
            idComponent = (this.msgComponents[(componentIndication as IndexChoiceIndication).index] as any as MsgComponentInteractive).id;
        }
        else if((componentIndication as ComponentChoiceIndication).component != undefined) {
            // research by component
            idComponent = (componentIndication as ComponentChoiceIndication).component.id;
        }
        else if((componentIndication as IdChoiceIndication).id != undefined) {
            // research by component
            idComponent = (componentIndication as IdChoiceIndication).id;
        }

        if(idComponent == undefined) {
            return defaultChoice;
        }

        for (let i = 0; i < choicesArr.length; i++) {
            if(choicesArr[i].id == idComponent) {
                if(choicesArr[i].choice != undefined) {
                    return choicesArr[i].choice;
                }
                return defaultChoice;
            }   
        }
        return defaultChoice;
    }

}