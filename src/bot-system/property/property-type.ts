import { MapName } from "../../tools/collection/map";

export interface PropOption {
    readOnly?: boolean  // can not be set by the PropAccess
}

export class Prop<PropType> {
    readonly name: string
    readonly option: PropOption
    value: PropType

    constructor(propName: string, value: PropType, option?: PropOption){
        this.name = propName;
        this.value = value;
        if(option==undefined) {
            this.option = {
                readOnly: false
            };
        }
        else {
            this.option = option; 
            if(option?.readOnly==undefined) {
                option.readOnly = false;
            }
        }
    }

    getPropAccess(): PropAccess<PropType> {
        return new PropAccess<PropType>(this);
    }
}

export class PropAccess<PropType> {
    private prop: Prop<PropType>

    constructor(prop: Prop<PropType>){
        this.prop = prop;
    }

    get name(){
        return this.prop.name;
    }
    get value(){
        return this.prop.value;
    }
    set value(newValue: PropType){
        if(!this.prop.option.readOnly){
            this.prop.value = newValue;
        }
    }
    get readonly() {
        return this.prop.option.readOnly;
    }

    toString(): string {
        return `${this.name}: ${this.value.toString()} (${typeof this.value}${this.readonly? ' readonly' : ''})`;
    }
}

// property for once component
export interface PropMapComponent {
    name: string,
    props: MapName<PropAccess<any>>
}
