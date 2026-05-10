import { Component } from "./component";
import { ComponentConf, ComponentType } from "./component-type";
import { UnitComponent } from "./unit-component";

export abstract class Extension<ComponentType extends Component> extends UnitComponent {
    conf: ComponentConf
    component: ComponentType

    // Constructor with the component linked to the extension 
    constructor(component: ComponentType, componentName: string, extensionName: string, description: string){
        super(`${componentName}.${extensionName}`, description);
        this.type = ComponentType.Extension;
        this.component = component;
        this.conf = component.conf;
        
        this.logInfo(`Extension ${this.name} created`);
    }
}