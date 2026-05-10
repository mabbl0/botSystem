import { MapName } from "../../tools/collection/map"
import { ComponentType } from "../component/component-type";

export interface Method {
    name: string,
    mth: Function,
    option: MethodOption
}

export interface MethodOption {
    onlyBsComponent?: boolean
}

// method for once component
export interface MthMapComponent {
    name: string,
    mths: MapName<Method>
}


export type MthAddPrototype = (ownerName: string, mthName: string, mth: Function, mthOption?: MethodOption) => void;
export type MthGetPrototype = <FctPrototype>(componentName: string, componentType: ComponentType, ownerName: string, mthName: string) => FctPrototype;
export type MthInitPrototype = (componentName: string) => void
