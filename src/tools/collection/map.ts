interface ToJsonBase {
    toJson(): Object
}

abstract class MapStr<ValueType> {
    protected map: Map<String, ValueType>

    constructor(){
        this.map = new Map<String, ValueType>();
    }

    abstract set(value: ValueType): void

    get size(): number {
        return this.map.size;
    }
    has(str: string): boolean {
        return this.map.has(str);
    }
    get(str: string): ValueType {
        return this.map.get(str);
    }
    forEach( callback: (value: ValueType) => void){
        this.map.forEach(callback);
    }
    delete(str: string): boolean{
        return this.map.delete(str);
    }

    toArr(): ValueType[] {
        let arr: ValueType[] = [];
        this.map.forEach( value => arr.push(value) );
        return arr;
    }
    

    /**
     * Reduce the map to a value
     * @param initValue value to initiate the reduce
     * @param callback callback to reduce each element from the map
     * @returns the reduce value
     */
    reduce<ReduceType>(initValue: ReduceType, callback: (reduceValue: ReduceType, elem: ValueType) => ReduceType ): ReduceType {
        let reduceValue = initValue;
        this.map.forEach( elem => 
            reduceValue = callback(reduceValue, elem) 
        );
        return reduceValue;
    }

    /**
     * return the first element to the map
     * @returns return the first element to the map, undefined is map empty
     */
    getFirst(): ValueType {
        if(this.map.size == 0) {
            return undefined;
        }
        return this.map.values().next().value;
    }

    /**
     * Get the value corresponding to the comparaison
     * @param compFct function to compare the value
     * @returns the value corresponding to the comparaison.
     */
    getByComp(compFct: (valueFound: ValueType, valueToComp: ValueType) => boolean): ValueType {
        if(this.map.size == 0) {
            return undefined;
        }
        if(this.map.size == 1) {
            return this.getFirst();
        }
        let valueFound: ValueType = this.getFirst();
        this.map.forEach( v => {
            if( compFct(valueFound, v) ) {
                valueFound = v;
            }
        });
        return valueFound;
    }

    getRandom(): ValueType {
        // [|0 ; size[|
        return Array.from( this.map.values() )[ Math.floor(Math.random() * Math.floor(this.map.size)) ];
    }

    toJson(fctCondition ?: (elem: ValueType) => boolean): Array<any> {
        let jsonArr: Array<any> = [];
        this.map.forEach(v => {
            if( fctCondition == undefined ||
                (fctCondition != undefined && fctCondition(v)))
            {
                jsonArr.push( (v as ToJsonBase).toJson ? (v as ToJsonBase).toJson() : v );
            }
        });
        return jsonArr;
    }
}


/*** Map Id str ***/

interface IdStrInterface {
    id: string
}
export class MapId<ValueType extends IdStrInterface> extends MapStr<ValueType>{
    // Map< Id , ValueType >
    set(value: ValueType){
        this.map.set(value.id, value);
    }
}

/*** Map Name ***/

interface NameInterface {
    name: string
}
export class MapName<ValueType extends NameInterface> extends MapStr<ValueType>{
    // Map< Name , ValueType >
    set(value: ValueType){
        this.map.set(value.name, value);
    }
}


/*** Map Name Id ***/

interface NameIdInterface {
    name: string
    id: string
}
export class MapNameId<ValueType extends NameIdInterface> extends MapStr<ValueType>{
    private mapName: Map<String, String> // Map< Name , Id >

    constructor(){
        super();
        this.mapName = new Map<String,String>();
    }

    set(value: ValueType){
        this.mapName.set(value.name, value.id);
        this.map.set(value.id, value);
    }
    // has value by id
    override has(id: string): boolean{
        return this.map.has(id);
    }
    hasByName(name: string): boolean {
        return this.mapName.has(name);
    }
    // get value by id
    override get(id: string): ValueType {
        return this.map.get(id);
    }
    getByName(name: string): ValueType {
        return this.map.get( this.mapName.get(name) );
    }
    // delete by id
    override delete(id: string): boolean{
        return this.mapName.delete( this.map.get(id).name ) && this.map.delete(id);
    }
    // delete by id
    deleteByName(name: string): boolean{
        return this.map.delete( this.mapName.get(name) ) && this.mapName.delete( name );
    }
}


/*** Map 2 keys + value ***/

export class Map2K<Key1Type, Key2Type, ValueType> {
    private mapK1K2: Map<Key1Type, Key2Type>
    private mapK2V: Map<Key2Type, ValueType>

    constructor(){
        this.mapK1K2 = new Map<Key1Type, Key2Type>();
        this.mapK2V = new Map<Key2Type, ValueType>();
    }

    set(key1: Key1Type, key2: Key2Type, value: ValueType){
        this.mapK1K2.set(key1, key2);
        this.mapK2V.set(key2, value);
    }

    has(key1: Key1Type): boolean{
        return this.mapK1K2.has(key1) && this.hasByKey2( this.getKey2(key1) );
    }
    hasByKey1(key1: Key1Type): boolean{
        return this.mapK1K2.has(key1);
    }
    hasByKey2(key2: Key2Type): boolean{
        return this.mapK2V.has(key2);
    }

    getKey2(key1: Key1Type): Key2Type {
        return this.mapK1K2.get(key1);
    }
    getValueByKey1(key1: Key1Type): ValueType {
        return this.getValueByKey2( this.mapK1K2.get(key1) );
    }
    getValueByKey2(key2: Key2Type): ValueType {
        return this.mapK2V.get(key2);
    }

    forEach( callback: (value: ValueType, key2: Key2Type, key1: Key1Type) => void){
        this.mapK1K2.forEach( (k2, k1) => callback( this.getValueByKey2(k2), k2, k1) );
    }
    forEachKeys( callback: (key2: Key2Type, key1: Key1Type) => void){
        this.mapK1K2.forEach( callback );
    }

    delete(key1: Key1Type): boolean{
        return this.mapK2V.delete( this.getKey2(key1) ) && this.mapK1K2.delete(key1);
    }
}