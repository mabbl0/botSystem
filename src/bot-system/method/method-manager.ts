import { MapName } from "../../tools/collection/map";
import { BotSystemState } from "../bot-system-type";
import { ComponentType } from "../component/component-type";
import { UnitComponent } from "../component/unit-component";
import { PropAccess } from "../property/property-type";
import { Method, MethodOption, MthMapComponent } from "./method-type";


export class MethodManager extends UnitComponent {
    private mthsMap: MapName<MthMapComponent>
    private propBsState: PropAccess<BotSystemState>

    constructor(propBsState: PropAccess<BotSystemState>) {
        super("MethodManager", "Manage BotSystem Method");
        this.propBsState = propBsState;
        this.mthsMap = new MapName<MthMapComponent>();
    }

    // initiate the methods for a new component
    initNewComponentMth(componentName: string) {
        if (!this.mthsMap.has(componentName)) {
            this.mthsMap.set({
                name: componentName,
                mths: new MapName<Method>()
            });
            this.logDebug(`component methods initiate for ${componentName}`);
        }
        else {
            this.logError(`component ${componentName} is already initiate`);
        }
    }

    /**
     * add a method to be used by other component
     * @param ownerName component name which add the method
     * @param mthName name of the method to add
     * @param mth mth pointer
     * @param mthOption method options
     */
    addMethod(ownerName: string, mthName: string, mth: Function, mthOption?: MethodOption) {
        if (this.propBsState.value != BotSystemState.Start &&
            this.propBsState.value != BotSystemState.Initialization) {
            this.logError("Shall add method before Boot in Initialization (constructor component)");
            return;
        }

        let mthsComponent = this.mthsMap.get(ownerName);
        if (!mthsComponent) {
            this.logError(`component methods not found (${ownerName}) to add method ${mthName}`);
            return;
        }

        if (mthsComponent.mths.has(mthName)) {
            this.logError(`component ${ownerName} has already a method ${mthName}`);
            return;
        }

        mthsComponent.mths.set({
            mth: mth,
            name: mthName,
            option: mthOption ? mthOption : {}
        });
        this.logInfo(`method ${mthName} add by ${ownerName}`);
    }

    /**
     * Get a method from an other component
     * @param componentName the component name which get the method
     * @param componentType type of the component
     * @param ownerName component name to found
     * @param mthName method name to found
     * @returns method found
     */
    getMethod<FctPrototype>(componentName: string, componentType: ComponentType, ownerName: string, mthName: string): FctPrototype {
        let mthsComponent = this.mthsMap.get(ownerName);
        if (!mthsComponent) {
            if (this.propBsState.value != BotSystemState.Start) {
                this.logError(`Methods Component ask by ${componentName} not found: ${ownerName}.${mthName}`);
            }
            return this.emptyFct as FctPrototype;
        }

        let mthFound = mthsComponent.mths.get(mthName);
        if (!mthFound) {
            if (this.propBsState.value != BotSystemState.Start) {
                this.logError(`Method asked by ${componentName} not found: ${ownerName}.${mthName}`);
            }
            return this.emptyFct as FctPrototype;
        }

        if (mthFound.option.onlyBsComponent && componentType != ComponentType.BotSystem) {
            this.logError(`Method ${ownerName}.${mthName} not authorized for ${componentName}`);
            return this.emptyFct as FctPrototype;
        }

        this.logDebug(`method ${ownerName}.${mthName} ask by ${componentName}`);
        return mthFound.mth as FctPrototype;
    }

    // empty function to get something even in error case
    private emptyFct(){
        if(this && this.logError){
            this.logError(`empty function call by ${this.name}`);
        }
    }


    // give method information about an component
    infoComponent(componentName: string): string {
        let componentMap = this.mthsMap.get(componentName);
        if(componentMap!=undefined && componentMap.mths.size!=0) {
            let strReturn = `- ${componentMap.mths.size} methods added:\n`;
            componentMap.mths.forEach(mth => strReturn += '  - ' + mth.name + '\n');
            return strReturn;
        }
        return '';
    }
}