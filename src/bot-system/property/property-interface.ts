import { Prop, PropAccess, PropOption } from "./property";
import { MethodInterface } from "../method/method-interface";

export class PropInterface {
    #componentName: string
    #mthInterface: MethodInterface
    #mthAddProp: <PropType>(ownerName: string, prop: Prop<PropType>) => void
    #mthGetProp: <PropType>(ownerName: string, componentName: string, propName: string) => PropAccess<PropType>

    
    /**
     * Initiate the property interface with component name
     * @param componentName 
     * @param mthInterface 
     * @internal
     */
    constructor(componentName: string, mthInterface: MethodInterface){
        this.#componentName = componentName;
        this.#mthInterface = mthInterface;

        this.initInterface();
    }
    
    
    /**
     * initiate the interface (in case if it can not be init in the constructor)
     * @internal
     */
    initInterface(){
        let mthInitNewComponentProps = this.#mthInterface.getMethod<(componentName: string) => void>("PropertyManager","initNewComponentProps");
        this.#mthAddProp = this.#mthInterface.getMethod("PropertyManager","addProp");
        this.#mthGetProp = this.#mthInterface.getMethod("PropertyManager","getProp");
        
        if(mthInitNewComponentProps){ // can be undefined for the first unit
            mthInitNewComponentProps(this.#componentName);
        }
    }

    /**
     * add a property to be used by other component
     * @param prop the property to add
     */
    addProp<PropType>(prop: Prop<PropType>){
        if(this.#mthAddProp){ // can be undefined for the first unit
            this.#mthAddProp<PropType>(this.#componentName, prop);
        }
    }

    /**
     * Create and add a property
     * @param propName the property name
     * @param value initial value of the property
     * @param readOnly is the property can be read
     * @return the property created
     */
    createAndAddProp<PropType>(propName: string, value: PropType, option?: PropOption): Prop<PropType> {
        let prop = new Prop<PropType>(propName, value, option);
        this.addProp( prop );
        return prop
    }

    /**
     * Create and add properties for each element in the object
     * @param objValue object with the value to add in property
     * @param readOnly is the property can be read 
     * @returns an object with the properties
     */
    addPropObj<ObjType extends { [key: string]: any }, PropObjType extends { [key: string]: any }>(objValue: ObjType, option?: PropOption, exept: Array<string> = []): PropObjType{
        let propObj: { [key: string]: any } = {};
        const keys = Object.keys(objValue) as (keyof ObjType)[];
        keys.forEach( kStr => {
            if(!exept.includes(kStr as string)){
                let prop = new Prop(kStr as string, objValue[kStr], option);
                propObj[kStr as string] = prop;
                this.addProp(prop);
            }
        });
        return propObj as PropObjType;
    }

    /**
     * Get a prop from an other component
     * @param #componentName component name to found
     * @param propName prop name to found
     * @returns prop found
     */
    getProp<PropType>(componentName: string, propName: string): PropAccess<PropType>{
        if(this.#mthGetProp){ // can be undefined for the first unit
            return this.#mthGetProp<PropType>(this.#componentName, componentName, propName);
        }
        return undefined;
    }
}
