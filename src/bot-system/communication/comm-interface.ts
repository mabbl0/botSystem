import { MethodInterface } from "../method/method-interface";
import { MessageComponent } from "./message-component/message-component";
import { MsgComponentDisplayType } from "./message-component/message-component-type";


export class CommInterface {
    private componentName: string
    private mthInterface: MethodInterface
    private mthCreateMessageComponent: (componentName: string, displayType?: MsgComponentDisplayType) => MessageComponent
 
    // constructor to init command interface
    constructor(componentName: string, mthInterface: MethodInterface) {
        this.componentName = componentName;
        this.mthInterface = mthInterface;
        this.initInterface();
    }

    // initiate the interface (in case if it can not be init in the constructor)
    initInterface() {
        this.mthCreateMessageComponent = this.mthInterface.getMethod("CommManager", "createMessageComponent");
    }

    /**
     * Create and return a message component to add text, buttons, .. to a message
     * @returns the message component to add text, buttons, ..
     */
    createMessageComponent(displayType: MsgComponentDisplayType = MsgComponentDisplayType.Message): MessageComponent {
        return this.mthCreateMessageComponent(this.componentName, displayType);
    }
    
}