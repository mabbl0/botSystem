
/**
 * return a random integer in [|min;max[|, or [|0;min[| if max is undefined, or [|0;100[| if min and max are undefined
 * @param min included minimum value, exept if max is undefined
 * @param max excluded maximum value
 * @returns a random integer in [|min;max[|, or [|0;min[| if max is undefined, or [|0;100[| if min and max are undefined
 */
export function randInt(min?: number, max?: number){
    if( min != undefined && max != undefined && min<=max){ 
        // [|min;max[|
        if(max-min == 1 || min==max) {
            return min;
        }
        return Math.floor( min + Math.floor(Math.random() * Math.floor(max-min)) );
    }
    else if(min!=undefined && min >= 0){
        // [|0;min[|
        if(min == 1 || min == 0) {
            return 0;
        }
        return Math.floor(Math.random() * Math.floor(min));
    }
    else{
        // [|0;100[|
        return Math.floor(Math.random() * Math.floor(100));
    }
}

/**
 * Return randomly -1 or 1
 */
export function randSign(): number {
    if(Math.random()<0.5) {
        return -1;
    }
    else {
        return 1;
    } 
}

/**
 * percent probability test, for uniform probability law
 * @param percent percent probability. 80 to get 80%.
 * @param precision precision to 1% by default. 0.1 to get a 0.1% precision
 * @returns return if the test is pass
 */
export function percent(percent: number, precision?: number): boolean {
    if(percent >= 100) {
        return true;
    }
    if(percent <= 0){
        return false;
    }
    if(precision==undefined) {
        return randInt() < percent;
    }
    return randInt(100/precision) < percent;
}

/***** Probability Array *****/

// select elements in a array with or without weigth for each element 
type ProbElem<ValueType> = {weight: number, value: ValueType};

/**
 * Array<Valuetype> | Array< {weight: number, value: ValueType} >
 */
export type ProbArray<ValueType> = Array<ProbElem<ValueType>> | Array<ValueType>;

// Select a random element in the array with or without weigth for each element

/**
 * Select one element in a array with or without weigth
 * @param probArr Arrray with the element to choose with or without weigth
 * @returns the element choosen
 */
export function choiceProbArr<ValueType>( probArr: ProbArray<ValueType> ): ValueType {
    if(probArr==undefined || (probArr && probArr.length == 0)){
        console.error('probability array shall not be empty');
        return undefined;
    }

    let probArrCast = probArr as Array<ProbElem<ValueType>>;
    if(probArrCast[0].weight == undefined || probArrCast[0].value == undefined) {
        let randomIndex = randInt(probArr.length);
        return probArr[randomIndex] as ValueType;
    }

    let totalWeight = probArrCast.reduce((sum, nextElem) => sum + nextElem.weight, 0);
    let r = randInt(totalWeight);
    let sum = 0;
    for (let i = 0; i < probArrCast.length; i++) {
        sum += probArrCast[i].weight;
        if(r < sum){
            return probArrCast[i].value;
        }
    }
    return probArrCast[probArrCast.length-1].value;
}

/**
 * Select one string in a probability arrayor return the string, if the input is a single string
 * @param str a single string or an Arrray with the string to choose with or without weigth
 * @returns the string choosen
 */
export function choiceString( str: string | ProbArray<String> ): string {
    if((str as string).trim){   // check if it is a string or an array
        return str as string;
    }
    return choiceProbArr<string>(str as ProbArray<string>);
}

/**
 * Concatenate several prob array in a single prob array
 * @param arrProbArr array of the prob array to combine
 * @returns the array combine
 */
export function concatPropArr<ValueType>(arrProbArr: Array<ProbArray<ValueType>>): ProbArray<ValueType> {
    let probArr: Array<ProbElem<ValueType>> = [];
    arrProbArr.forEach( pArr => {
        if(pArr.length == 0) {
            return;
        }
        if((pArr[0] as ProbElem<ValueType>).weight == undefined && (pArr[0] as ProbElem<ValueType>).value == undefined) {
            (pArr as Array<ValueType>).forEach( elem => {
                probArr.push({weight: 1, value: elem});
            });
        }
        else {
            probArr = probArr.concat(pArr as Array<ProbElem<ValueType>>);
        }
    });
    return probArr;
}

/**
 * Concatenate string and prob array in a single prob array
 * @param arrStrProbArr array of the string and prob array to combine
 * @returns the array combine
 */
export function concatStringProbArr(arrStrProbArr: Array<string | ProbArray<string>>): ProbArray<string> {
    for (let i = 0; i < arrStrProbArr.length; i++) {
        if((arrStrProbArr[i] as string).trim) {
            arrStrProbArr[i] = [arrStrProbArr[i] as string];
        }
    }
    return concatPropArr<string>(arrStrProbArr as Array<ProbArray<string>>);
}

/**
 * Pick random elements in a array, with or without condition
 * @param arr array to pick the elements
 * @param nbToPick number of element to pick
 * @param fctCondition condition function to pick an element
 * @returns the element pickek. Warning there can be lesss than nbToPick
 */
export function pickRandom<ElemType>(arr: ElemType[], nbToPick: number, fctCondition?: (elem: ElemType)=>boolean): ElemType[] {
    if(nbToPick<=0){
      return [];
    }

    // only 1 pick without condition
    if(nbToPick == 1 && fctCondition == undefined) {
        return [ arr[ randInt(arr.length) ] ];
    }
    // pick all without condition
    if(nbToPick >= arr.length && fctCondition == undefined) {
        return arr;
    }

    // initiate a list of the possible element which can be pick
    let possibleIndexArr = [];
    if(fctCondition != undefined){
      for (let i = 0; i < arr.length; i++) {
        if( fctCondition(arr[i]) ){
          possibleIndexArr.push(i);
        }
      }
    }else{
      for (let i = 0; i < arr.length; i++) {
        possibleIndexArr.push(i);
      }
    }

    // no possible element to pick
    if(possibleIndexArr.length == 0){
      return [];
    }
    // only 1 pick
    if(nbToPick == 1){
      return [ arr[ possibleIndexArr[randInt(possibleIndexArr.length)] ] ];
    }
    // pick all without condition
    if(nbToPick >= possibleIndexArr.length) {
        return arr;
    }

    // pick the random index
    let pickIdArr = [];
    let indexPick: number;
    for (let i=0 ; i<nbToPick && i<possibleIndexArr.length ; i++) {
      indexPick = randInt(possibleIndexArr.length);
      pickIdArr.push( possibleIndexArr[indexPick] );

      possibleIndexArr.splice(indexPick,1);
    }

    // get the random element picked
    let returnArray: ElemType[] = [];
    for( let i=0 ; i<pickIdArr.length ; i++){
      returnArray.push( arr[pickIdArr[i]] );
    }
    return returnArray;
}

/**
 * Ramdomly Split element from an array into sub array 
 * @param arr array to split the elements
 * @param nbSplit number of split
 * @returns the elements randomly split in sub array
 */
export function randomSplit<ElemType>(arr: ElemType[], nbSplit: number): ElemType[][] {
    if(nbSplit<=1) {
        return [arr];
    }

    // init the return split array
    let splitArr: ElemType[][] = [];
    for (let i = 0; i < nbSplit; i++) {
        splitArr.push([]);
    }

    // distribute randomly the element in the sub array
    let arrCopy = arr.slice();
    let splitIndex = 0; 
    let randomIndex: number;
    for (let i=0 ; i<arrCopy.length ; i++) {
        randomIndex = randInt(arrCopy.length);
        splitArr[splitIndex].push( arrCopy[randomIndex] );
        arrCopy.splice(randomIndex, 1);
        i += -1;

        splitIndex = (splitIndex+1) % nbSplit;
    }
    return splitArr;
}