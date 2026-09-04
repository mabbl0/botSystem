import {loadData} from '../../tools/file'
import { ComponentType, ComponentConf } from './component-type'
import { Extension } from './extension'
import { SaveInterface } from './save-interface'
import { UnitComponent } from './unit-component'

export abstract class Component extends UnitComponent {
    /** component configuration */
    conf: ComponentConf
    /** list of the component's extension */
    extensionList: Array<Extension<Component>>
    
    /** Interface to load and save the component save file */
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
            let confPathDir = this.propInterface.getProp<string>("ComponentManager","confPathDir");
            let conf = loadData<ComponentConf>(  confPathDir!=undefined ? 
                (confPathDir.value + '/' + confFileName) : 
                ('./' + confFileName));
            if(conf != undefined) {
                this.conf = conf;
            }

            // set prop from conf
            if(this.conf.logLevel!=undefined) {
                this.propLogLevel.value = this.conf.logLevel;
            }
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