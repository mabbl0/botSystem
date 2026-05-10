import { UnitComponent } from "../component/unit-component";
import { MapName } from "../../tools/collection/map";
import { Prop, PropAccess, PropMapComponent } from '../property/property-type'
import { Message } from "../communication/message";

export class PropertyManager extends UnitComponent {
    private propsMap: MapName<PropMapComponent>

    constructor() {
        super("PropertyManager", "Manage BotSystem Preperty");
        this.propsMap = new MapName<PropMapComponent>();

        this.mthInterface.addMethod("initNewComponentProps", this.initNewComponentProps.bind(this));
        this.mthInterface.addMethod("addProp", this.addProp.bind(this));
        this.mthInterface.addMethod("getProp", this.getProp.bind(this));

        this.initTxtCommand();
    }

    // initiate the property for a new component
    initNewComponentProps(componentName: string) {
        if (!this.propsMap.has(componentName)) {
            this.propsMap.set({
                name: componentName,
                props: new MapName<PropAccess<any>>()
            });
            this.logDebug(`component properties initiate for ${componentName}`);
        }
        else {
            this.logError(`component ${componentName} is already initiate`);
        }
    }

    /**
     * add a property to be used by other component
     * @param ownerName the component name which add the property
     * @param prop the property to add
     */
    addProp<PropType>(ownerName: string, prop: Prop<PropType>) {
        let propsComponent = this.propsMap.get(ownerName);
        if (!propsComponent) {
            this.logError(`component ${ownerName} not initiate to add ${prop.name} property`);
            return;
        }

        if (propsComponent.props.has(prop.name)) {
            this.logError(`component ${ownerName} has already a property ${prop.name}`);
            return;
        }

        propsComponent.props.set(new PropAccess(prop));
        this.logInfo(`property ${prop.name} add by ${ownerName}`);
    }

    /**
     * Get a prop from an other component
     * @param componentName the component name which get the property
     * @param ownerName component name to found
     * @param propName prop name to found
     * @returns prop found
     */
    getProp<PropType>(componentName: string, ownerName: string, propName: string): PropAccess<PropType> {
        let propsComponent = this.propsMap.get(ownerName);
        if (!propsComponent) {
            this.logError(`Propperties component ask by ${componentName} not found: ${ownerName}.${propName}`);
            return undefined;
        }

        let propFound = propsComponent.props.get(propName);
        if (!propFound) {
            this.logError(`Property asked by ${componentName} not found: ${ownerName}.${propName}`);
            return undefined;
        }

        this.logDebug(`property ${ownerName}.${propName} ask by ${componentName}`);
        return propFound;
    }


    /**** Text Commands ****/

    // initiate the PropertyManager txtCmd
    initTxtCommand() {
        this.cmdInterface.addTxtCmd("getProp",
            "Access to a property from a component. '!getProp ComponentName.PropName'",
            this.txtCmdGetProp.bind(this),
            { adminOnly: true }
        );
        this.cmdInterface.addTxtCmd("setProp",
            "Change a property value. Works only with string, number, or boolean properties. '!setProp ComponentName.PropName = newValue'",
            this.txtCmdSetProp.bind(this),
            { adminOnly: true }
        );


    }

    // text command to get a property
    txtCmdGetProp(msg: Message, arg: string) {
        let componentsName = arg.match(/\w+(?=\.)/g);
        let propsName = arg.match(/(?<=\.)\w+/g);
        if (!componentsName || !propsName) {
            msg.reply("Not understand component or property name");
            return;
        }
        if (componentsName.length != propsName.length) {
            msg.reply("Not enough component or property name");
            return;
        }

        let strToReply = "";
        for (let i = 0; i < componentsName.length; i++) {
            let propsComponent = this.propsMap.get(componentsName[i]);
            if (!propsComponent) {
                msg.reply(`Component ${componentsName[i]} not found`);
                return;
            }
            let propFound = propsComponent.props.get(propsName[i]);
            if (!propFound) {
                msg.reply(`Property ${propsName[i]} not found`);
                return;
            }

            strToReply += '- `' + propsComponent.name + '.' + propFound.toString() + '`\n';
        }

        msg.reply(strToReply);
    }

    // text command to set a propety, if not in readonly
    txtCmdSetProp(msg: Message, arg: string) {
        let componentsName = arg.match(/\w+(?=\.)/g);
        let propsName = arg.match(/(?<=\.)\w+/g);
        let valuesStr = arg.match(/(?<=\=) *\w+/g);
        if (!componentsName || !propsName || !valuesStr) {
            if (this.tryToSetMultiple(msg, arg)) {
                return;
            }
            msg.reply("Not understand component name, property name, or value format");
            return;
        }
        if (componentsName.length != propsName.length && componentsName.length != valuesStr.length) {
            msg.reply("Not enough component name, property name, or value");
            return;
        }

        let strToReply = "";
        for (let i = 0; i < componentsName.length; i++) {
            let propsComponent = this.propsMap.get(componentsName[i]);
            if (!propsComponent) {
                msg.reply(`Component ${componentsName[i]} not found`);
                return;
            }
            let propFound = propsComponent.props.get(propsName[i]);
            if (!propFound) {
                msg.reply(`Property ${propsName[i]} not found`);
                return;
            }
            if (propFound.readonly) {
                msg.reply(`Property ${componentsName[i]}.${propsName[i]} in readonly`);
                return;
            }

            let res = this.setPropFromStr(propFound, valuesStr[i]);
            if(!res) {
                msg.reply(`Property ${componentsName[i]}.${propsName[i]} can not be set`);
            }
            strToReply += '- `' + propsComponent.name + '.' + propFound.toString() + '`\n';
        }

        msg.reply(strToReply);
    }

    /**
     * try to set multiple prop, from the !setProp command
     * @param msg message sent for the command
     * @param arg argument givr
     * @returns indicate if the message is reply
     */
    private tryToSetMultiple(msg: Message, arg: string): boolean {
        let propsName = arg.match(/\w+ *(?=\=)/g);
        let valuesStr = arg.match(/(?<=\=) *\w+/g);
        if (!propsName || !valuesStr || 
            propsName?.length!=1 || valuesStr?.length!=1 )
        {
            return false;
        }

        // search the prop
        const nbComponentMaxToDisplay = 6;
        let strToReply = '';

        let propName = propsName[0].trim();
        let nbFound = 0;
        let isSet: boolean;
        let propFound: PropAccess<any>;
        this.propsMap.forEach(m => {
            propFound = m.props.get(propName);
            if (propFound) {
                isSet = this.setPropFromStr(propFound, valuesStr[0]);
                if(isSet) {
                    nbFound += 1;
                    if(nbFound < nbComponentMaxToDisplay) {
                        strToReply += '- `' + m.name + '.' + propFound.toString() + '`\n';
                    }
                }
            }
        });
        if (nbFound==0) {
            strToReply = `Property ${propsName[0]} not found`;
        }
        else if(nbFound >= nbComponentMaxToDisplay) {
            strToReply += '...';
        }
        
        msg.reply(strToReply);
        return true;
    }

    /**
     * Set an property from an string value
     * @param prop property to set
     * @param valueStr new value in string
     * @returns indicate if the prop is set
     */
    private setPropFromStr(prop: PropAccess<any>, valueStr: string): boolean {
        valueStr = valueStr.trim();
        // TODO?: add prop type to simplify the set prop 
        switch (typeof prop.value) {
            case 'string':
                prop.value = valueStr;
                break;
            case 'number':
                prop.value = Number.parseInt(valueStr);
                break;
            case 'boolean':
                prop.value = (valueStr.toLowerCase() === 'true' || valueStr === '1');
                break;
            default:
                return false;
        }
        return true;
    }


    // give properties information about an component
    infoComponent(componentName: string): string {
        let componentMap = this.propsMap.get(componentName);
        if (componentMap != undefined && componentMap.props.size != 0) {
            let strReturn = `- ${componentMap.props.size} properties:\n`;
            componentMap.props.forEach(prop => strReturn += '  - ' + prop.toString() + '\n');
            return strReturn;
        }
        return '';
    }

}