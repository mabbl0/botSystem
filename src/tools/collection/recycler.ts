
export interface RecycledItem<ItemType> {
    used: boolean
    trashBackFct: (item: ItemType) => void

    recycle(itemData: any): void
    trash():void
}

type ItemConstructor<ItemType> = new (trashBackFct: (itemRecycled:ItemType) => void ) => ItemType;

// Recycle item to avoid the dynamic allocation 
export class Recycler<ItemType extends RecycledItem<ItemType>> {
    private itemStock: Array< ItemType >
    private itemConstructor: ItemConstructor<ItemType>
    private initItemFct: (item: ItemType) => void

    constructor(nbInStock: number, itemConstructor: ItemConstructor<ItemType>){
        this.itemStock = [];
        this.itemConstructor = itemConstructor;
        for (let i = 0; i < nbInStock ; i++) {
            this.itemStock.push( new itemConstructor( this.trashBack.bind(this) ) );
        }
    }

    initItems( initFct: (item: ItemType) => void){
        this.initItemFct = initFct;
        this.itemStock.forEach(initFct);
    }

    // give a recycled item
    getRecycledMessage(itemData: any): ItemType{
        let itemRecycled: ItemType;
        if(this.itemStock.length > 0){
            itemRecycled = this.itemStock.splice(0,1)[0]; // pop the first item
        }
        else {
            itemRecycled = new this.itemConstructor( this.trashBack.bind(this) );
            this.initItemFct(itemRecycled);
        }
        
        itemRecycled.recycle(itemData);
        return itemRecycled;
    }

    // receive item not use
    trashBack(itemRecycled: ItemType){
        this.itemStock.push( itemRecycled );
    }
}