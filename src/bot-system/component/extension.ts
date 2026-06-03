import { Component } from "./component";
import { ComponentConf, ComponentType } from "./component-type";
import { UnitComponent } from "./unit-component";

export abstract class Extension<ComponentType extends Component> extends UnitComponent {
    conf: ComponentConf
    component: ComponentType

    /**
     * Constructor with the component linked to the extension
     * @param component the component link to the extension
     * @param extensionName the extension name
     * @param description the description of the extension
     */
    constructor(component: ComponentType, extensionName: string, description: string){
        super(`${component.name}.${extensionName}`, description);
        this.type = ComponentType.Extension;
        this.component = component;
        this.conf = component.conf;
        
        this.logInfo(`Extension ${this.name} created`);
    }
}