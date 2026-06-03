import {loadData} from '../../tools/file'
import { ComponentType, ComponentConf } from './component-type'
import { Extension } from './extension'
import { SaveInterface } from './save-interface'
import { UnitComponent } from './unit-component'

export abstract class Component extends UnitComponent {
    /** @internal */
    conf: ComponentConf
    /** @internal */
    extensionList: Array<Extension<Component>>
    /** @internal */
    protected saveInterface: SaveInterface

    /**
     * Create the component with default conf
     * @param name Component name
     */
    constructor(name: string, description: string){
        super(name, description);
        this.type = ComponentType.Component;

        this.extensionList = [];

        // init default conf
        this.conf = {
            logLevel: 3, // Info
            savePathFile: "",
            saveFileVersion: 0
        };
        this.loadConf();

        this.saveInterface = new SaveInterface(this.log.bind(this), this.name, this.propInterface, this.conf.savePathFile, this.conf.saveFileVersion);

        this.logInfo(`Component ${name} created`);
    }

    /**
     * Load the component configuration from its configuration file
     * @internal
     */
    private loadConf(){
        const confFileName = this.name.replace(/(?<!^)(?=[A-Z])/g,'-').toLowerCase() + '-conf.json';
        try {
            let confPathDir = this.propInterface.getProp("ComponentManager","confPathDir");
            if(confPathDir.value == undefined){
                this.conf = loadData<ComponentConf>('./' + confFileName);
            }
            else{
                this.conf = loadData<ComponentConf>(confPathDir.value + '/' + confFileName);
            }
            // set prop from conf
            this.propLogLevel.value = this.conf.logLevel;
        } catch (e) {
            // component can to not have conf file
        }
    }
    
    /**
     * indicate default value for the component configuration
     * @param defaultConf default configuration for the component
     */
    defaultConf<Conf extends ComponentConf>(defaultConf: Conf) {
        const keys = Object.keys(defaultConf) as (keyof Conf)[];
        let conf = this.conf as Conf;
        keys.forEach( kStr => {
            if(conf[kStr] == undefined){
                conf[kStr] = defaultConf[kStr];
            }
        });
    }
}