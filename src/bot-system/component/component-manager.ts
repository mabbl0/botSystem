import { resolve } from 'path'
import type { ComponentPath,  UnitPath, BotSystemConf} from '../bot-system-type'
import { Component } from './component'
import { UnitComponent } from './unit-component';
import { ComponentType } from './component-type';
import { CommandManager } from '../communication/command/command-manager';
import { EventManager } from '../event/event-manager';
import { MethodManager } from '../method/method-manager';
import { PropertyManager } from '../property/property-manager';
import { pickRandom } from '../../tools/random';
import { CommunicationBase } from '../communication/comm-type';
import { Message } from '../communication/message';


export class ComponentManager extends UnitComponent {
    private componentArr: Array<Component>
    private bsComponentArr: Array<UnitComponent>
    private bsConf: BotSystemConf

    private cmdManager: CommandManager
    private eventManager: EventManager
    private mthManager: MethodManager
    private propManager: PropertyManager

    constructor(bsConf: BotSystemConf, ) {
        super("ComponentManager", "Manage BotSystem Component");

        this.bsConf = bsConf;
        this.componentArr = [];
        this.bsComponentArr = [];   // BotSystem Component

        this.cmdInterface.addTxtCmd('ls', 'get component information', this.lsComponent.bind(this), {adminOnly: true});
        this.cmdInterface.addTxtCmd('help', 'get help to use the bot', this.cmdHelp.bind(this));
        this.cmdInterface.addSlashCmd('help', 'get help to use the bot', this.cmdHelp.bind(this));

        this.logInfo("Create and Initiate Components");
        this.initComponents();
        // TODO: add log to resume the component load
    }

    /*** Create Components and Extensions ***/

    // Initiate the components with the component list given by the configuration file
    initComponents() {
        this.propInterface.createAndAddProp("confPathDir", this.bsConf.components.confPath, {readOnly: true});

        this.bsConf.components.componentList.forEach(componentPath => {
            try {
                this.initComponent(componentPath);
            } catch (e) {
                this.logError(`Fail to initiate the ${componentPath.name} component:`);
                console.error(e);
            }
        });
    }

    // Initiate a component indicate in botSystem configuration
    initComponent(componentPath: ComponentPath) {
        const ComponentClass = require(resolve(this.bsConf.components.srcDir + componentPath.path));
        if (ComponentClass && ComponentClass.default) {
            this.componentArr.push(new ComponentClass.default(componentPath.name));

            // create and init extension link to the new component
            if(componentPath.extensionList){
                componentPath.extensionList.forEach(extensionPath => {
                    try {
                        this.initExtension(this.componentArr[this.componentArr.length -1], extensionPath);
                    } catch (e) {
                        this.logError(`Fail to initiate the ${extensionPath.name} extension:`);
                        console.error(e);
                    }
                });
            }
        }
        else {
            this.logError(`default export for the ${componentPath.name} component not found`);
        }
    }

    // Initiate a extension connected to a component indicate in the configuration
    initExtension(component: Component, extensionPath: UnitPath){
        const ExtensionClass = require(resolve(this.bsConf.components.srcDir + extensionPath.path));
        if(ExtensionClass && ExtensionClass.default) {
            component.extensionList.push( 
                new ExtensionClass.default(component, component.name, extensionPath.name) 
            );
        }
        else{
            this.logError(`default export for the ${extensionPath.name} extension to found`);
        }
    }

    // Add botSystem component to the list
    addBsComponent(bsComponent: UnitComponent){
        this.bsComponentArr.push( bsComponent );
        switch (bsComponent.name) {
            case 'CommandManager':
                this.cmdManager = bsComponent as CommandManager;
                break;
            case 'EventManager':
                this.eventManager = bsComponent as EventManager;
                break;
            case 'MethodManager':
                this.mthManager = bsComponent as MethodManager;
                break;
            case 'PropertyManager':
                this.propManager = bsComponent as PropertyManager;
                break;
            default:
                break;
        }
    }

    // Initiate the log in bot Channel
    initLogComponent(sentFct: (msg: string)=>void ) {
        this.componentArr.forEach( comp => comp.initLogInBotChannel(sentFct) );
        this.bsComponentArr.forEach( comp => comp.initLogInBotChannel(sentFct) );
    }


    // Initiate components
    override boot() {
        // Components and Extensions Boot. Bot API may be not connected
        this.componentArr.forEach(component => {
            component.boot();
            component.extensionList.forEach( extension => {
                extension.boot();
            });
        });
        // BotSystem Components boot
        this.bsComponentArr.forEach(component => {
            component.boot();
        });

        this.bsComponentArr.push(this);
    }


    /*** Text Command to info about component 
     * it is a admin text command
    */
    private lsComponent(msg: Message, researchArg: string) {
        let researchStr = researchArg.trim().toLowerCase();
        let hasAresearch = researchStr!=undefined && researchStr.length != 0;
        let strReply = '';
        let hasComponentReply = false;
        let botSystemDescription = {name: 'BotSystem', description: 'BotSystem main', type: ComponentType.BotSystem};
        if(hasAresearch) {
            this.componentArr.forEach( c => {
                if(researchArg.includes(c.name)) {
                    hasComponentReply = true;
                    strReply += this.infoComponent(c);
                }
                c.extensionList.forEach( e => {
                    if(researchArg.includes(e.name)) {
                        hasComponentReply = true;
                        strReply += this.infoComponent(e);
                    }
                });
            });
            this.bsComponentArr.forEach( c => {
                if(researchArg.includes(c.name)) {
                    hasComponentReply = true;
                    strReply += this.infoComponent(c);
                }
            });

            if(researchArg.includes(botSystemDescription.name)) {
                hasComponentReply = true;
                strReply += this.infoComponent(botSystemDescription);
            }
        }

        if(!hasComponentReply) {
            if(hasAresearch) {
                strReply += `component research for '${researchStr}':\n`
            }

            let strComponent = '';
            let nbComponent = 0;
            this.componentArr.forEach( c => {
                if(!hasAresearch || c.name.toLowerCase().includes(researchStr)) {
                    nbComponent += 1;
                    strComponent += '- ' + c.toString() + '\n';
                    c.extensionList.forEach(e => strComponent += '  - ' + e.toString() + '\n');
                }
                else if(hasAresearch) {
                    c.extensionList.forEach( e => {
                        if(e.name.toLowerCase().includes(researchStr)) {
                            nbComponent += 1;
                            strComponent += '- ' + c.toString() + '\n';
                            strComponent += '  - ' + e.toString() + '\n';
                        }
                    });
                }
            });
            if(nbComponent>0) {
                strReply += `## ${nbComponent} Components\n`;
                strReply += strComponent;
            }
            
            let strBsComponent = '';
            let nbBsComponent = 0;
            this.bsComponentArr.forEach( c => {
                if(!hasAresearch || c.name.toLowerCase().includes(researchStr)) {
                    nbBsComponent += 1;
                    strBsComponent += '- ' + c.toString() + '\n';
                }
            });
            if(!hasAresearch || botSystemDescription.name.toLowerCase().includes(researchStr)) {
                nbBsComponent += 1;
                strBsComponent += `- **${botSystemDescription.name}**: ${botSystemDescription.description}\n`;
            }
            if(nbBsComponent>0) {
                strReply += `### ${nbBsComponent} BotSystem Components\n`;
                strReply += strBsComponent;
            }
        }
        
        msg.reply({ content: strReply, 
            option: { ephemeral: true } });
    }

    // return the information about a specific component
    private infoComponent(component: {name: string, description: string, type: ComponentType}): string {
        let strReturn = `## ${component.name}\n`;
        strReturn += `> ${component.description}\n`;
        
        // Extension, if component
        if(component.type == ComponentType.Component) {
            let extensionList = (component as Component).extensionList;
            if(extensionList.length!=0) {
                strReturn += `- ${extensionList.length} Extensions:\n`;
                extensionList.forEach( e => strReturn += '  - ' + e.toString() + '\n');
            }

            let saveFile = (component as Component).conf.savePathFile;
            if(saveFile!=undefined) {
                strReturn += `- Save file: ${saveFile}\n`;
            }
        }
        else if(component.name == this.eventManager.name) {
            strReturn += `- Save file: ${this.eventManager.saveFileName}\n`;
        }

        // Commands
        strReturn += this.cmdManager.infoComponent(component.name);
        // Events
        strReturn += this.eventManager.infoComponent(component.name);
        // Methods
        strReturn += this.mthManager.infoComponent(component.name);
        // Properties
        strReturn += this.propManager.infoComponent(component.name);

        return strReturn;
    }

    /**
     * help command
     */
    cmdHelp(comm: CommunicationBase<Message>) {
        let strReply = `## ${this.bsConf.name}\n> ${this.bsConf.description}\n`;
        strReply += 'To send a command, start a message with "!" or "/" and continue with the command name\n';
        strReply += '- send `!helpCmd` to get the list of the avaible commands\n\n';
        strReply += 'Some feature of the bot:\n';
        pickRandom(this.componentArr, 4).forEach(c => strReply += `- ${c.description}\n`);
        comm.reply({content: strReply, option: {ephemeral: true}});
    }

}