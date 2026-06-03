import { ComponentType } from "../component/component-type"
import { MethodOption, MthAddPrototype, MthGetPrototype, MthInitPrototype } from "./method-type"

export class MethodInterface {
    #componentName: string
    #ptrType: {value: ComponentType}

    #mthAddMethod: MthAddPrototype
    #mthGetMethod: MthGetPrototype

    /**
     * Initiate the method interface with component name
     * @param componentName 
     * @param ptrType 
     * @param mthAddMethod 
     * @param mthGetMethod 
     * @param mthInitNewComponent 
     * @internal
     */
    constructor(componentName: string, ptrType: {value: ComponentType}, mthAddMethod: MthAddPrototype, mthGetMethod: MthGetPrototype, mthInitNewComponent: MthInitPrototype){
        this.#componentName = componentName;
        this.#ptrType = ptrType;
        this.initInterface(mthAddMethod, mthGetMethod, mthInitNewComponent);
    }

    
    /**
     * initiate the interface (in case if it can not be init in the constructor)
     * @param mthAddMethod 
     * @param mthGetMethod 
     * @param mthInitNewComponent 
     * @internal
     */
    initInterface(mthAddMethod: MthAddPrototype, mthGetMethod: MthGetPrototype, mthInitNewComponent: MthInitPrototype){
        if(this.#mthAddMethod==undefined && this.#mthGetMethod==undefined){ // only once
            this.#mthAddMethod = mthAddMethod;
            this.#mthGetMethod = mthGetMethod;
            
            if(mthInitNewComponent){ // can be undefined for the first unit
                mthInitNewComponent(this.#componentName);
            }
        }
    }

    /**
     * add a method to be used by other component
     * @param mthName name of the method to add
     * @param mth mth pointer
     * @param mthOption method options
     */
    addMethod(mthName: string, mth: Function, mthOption?: MethodOption){
        if(this.#mthAddMethod){
            this.#mthAddMethod(this.#componentName, mthName, mth, mthOption);
        }
    }

    /**
     * Get a method from an other component
     * @param componentName component name to found
     * @param mthName method name to found
     * @returns method found
     */
    getMethod<FctPrototype>(componentName: string, mthName: string): FctPrototype{
        if(this.#mthGetMethod){
            return this.#mthGetMethod<FctPrototype>(this.#componentName, this.#ptrType.value, componentName, mthName);
        }
        return undefined;
    }
}
