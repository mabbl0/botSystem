import { SaveInterface } from "../component/save-interface";

/**
 * To Save data: every X time if needed, or if more than N save are asked with a T time cooldown
 */
export class SaveController<DataType> {
    #dataToSave: DataType
    #saveInterface: SaveInterface

    #nbSaveAsked: number
    #nbAskToSave: number
    #saveCooldown: number // in ms
    #saveAfterAskTime: number // in ms
    #hasCurrentTimeoutSave: boolean

    /**
     * Data Save Controller
     * @param saveInterface the component save interface
     * @param ptrToData pointer to the data to save
     * @param nbAskToSave number of ask before save the data
     * @param saveCooldown minimum time before 2 save, in ms
     * @param saveAfterAskTime try to save after X time of the first ask, in ms
     */
    constructor(saveInterface: SaveInterface, ptrToData: DataType, nbAskToSave: number, saveCooldown?: number, saveAfterAskTime?: number){
        this.#saveInterface = saveInterface;
        this.#dataToSave = ptrToData;
        this.#nbSaveAsked = 0;
        this.#nbAskToSave = nbAskToSave;
        this.#saveCooldown = saveCooldown;
        this.#saveAfterAskTime = saveAfterAskTime;
        this.#hasCurrentTimeoutSave = false;
    }

    /**
     * Ask to save the component data
     */
    askToSave(){
        this.#nbSaveAsked += 1;
        if(this.#nbSaveAsked >= this.#nbAskToSave) {
            if(Date.now() - this.#saveInterface.lastDateSave > this.#saveCooldown) {
                this.save();
            }
        }
        else if(!this.#hasCurrentTimeoutSave) {
            // try to save after X time
            setTimeout(() => {
                this.#hasCurrentTimeoutSave = false;
                if(this.#nbSaveAsked>0){
                    this.save();
                }
            }, Date.now() + this.#saveAfterAskTime);
            this.#hasCurrentTimeoutSave = true;
        }
    }

    // Save the Data
    save(){
        this.#nbSaveAsked = 0;
        // try to save with json method if possible
        this.#saveInterface.save<DataType>(
            (this.#dataToSave as {toJson(): DataType}).toJson ? 
                (this.#dataToSave as {toJson(): DataType}).toJson() : this.#dataToSave 
        );
    }

}