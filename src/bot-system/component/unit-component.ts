import { CommInterface } from "../communication/comm-interface";
import { CommandInterface } from "../communication/command/command-interface";
import { EventInterface } from "../event/event-interface";
import { Unit } from "./unit";

export abstract class UnitComponent extends Unit {

    /** Interface to subscribe to a event, or add a 'wake up on date' event */
    eventInterface: EventInterface
    
    /** Interface to add text command or slash command */
    cmdInterface: CommandInterface

    /** Interface to create modal or message component */
    commInterface: CommInterface

    constructor(name: string, description: string){
        super(name, description);

        // init interface
        this.eventInterface = new EventInterface(name, this.mthInterface);
        this.cmdInterface = new CommandInterface(this);
        this.commInterface = new CommInterface(name, this.mthInterface);
        
        this.logDebug(`UnitComponent ${name} created`);
    }
    
    /*** Component Initialization Methods ***/

    /** Component boot
     * Bot api may be not connected
     * Sub the BootConnectedEvent, for a boot after api connection
    */
    boot(){
    }
}