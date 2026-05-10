
export class Attribute {
    [key: string]: any

    /**
     * Add new value attributes to initiate attributes not already here 
     * @param defaultAttr default value of the attributes to add. Useful to get keys object in runtime
     */
    addNewAttributes<AttrType extends { [key: string]: any }>(defaultAttr: AttrType) {
        const keys = Object.keys(defaultAttr) as (keyof { [key: string]: any })[];
        keys.forEach(keyStr => {
            if (this[keyStr] == undefined) {
                this[keyStr] = defaultAttr[keyStr];
            }
        });
    }

    /**
     * get attributes casted
     * @returns attributes casted
     */
    getAttr<AttrType extends { [key: string]: any }>(): AttrType {
        return this as any as AttrType;
    }

    /** Load and Save **/

    // load data. Replace attribute value, or create a new attribute
    load(attrLoaded: { [key: string]: any }) {
        const keysLoaded = Object.keys(attrLoaded) as (keyof { [key: string]: any })[];
        keysLoaded.forEach(keyStr => {
            this[keyStr] = attrLoaded[keyStr];
        });
    }

}