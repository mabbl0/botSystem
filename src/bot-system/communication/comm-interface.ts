import { MethodInterface } from "../method/method-interface";
import { MessageComponent } from "./message-component/message-component";
import { Modal, ModalBase } from "./message-component/modal";


export class CommInterface {
    private componentName: string
    private mthInterface: MethodInterface
    private mthCreateMessageComponent: (componentName: string) => MessageComponent
    private mthCreateModal: (componentName: string, modal: ModalBase) => Modal
 
    // constructor to init command interface
    constructor(componentName: string, mthInterface: MethodInterface) {
        this.componentName = componentName;
        this.mthInterface = mthInterface;
        this.initInterface();
    }

    // initiate the interface (in case if it can not be init in the constructor)
    initInterface() {
        this.mthCreateMessageComponent = this.mthInterface.getMethod("CommManager", "createMessageComponent");
        this.mthCreateModal = this.mthInterface.getMethod("CommManager", "createModal");
    }

    /**
     * Create and return a message component to add text, buttons, .. to a message
     * @returns the message component to add text, buttons, ..
     */
    createMessageComponent(): MessageComponent {
        return this.mthCreateMessageComponent(this.componentName);
    }

    /**
     * Create and return a modal to add text, buttons, .. to a message
     * @returns the modal to add text, buttons, ..
     */
    createModal(modal: ModalBase): Modal {
        return this.mthCreateModal(this.componentName, modal);
    }
    
}