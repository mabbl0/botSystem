
/**
 * saturate a number
 * @param valueToSaturate the value to saturate
 * @param min the minimum limite for the value, no min limite if undefined
 * @param max the maximum for the value, no max limite if undefined
 * @returns the value saturate
 */
export function saturate(valueToSaturate: number, min: number, max?:number): number {
    if(min!=undefined && valueToSaturate < min){
        return min;
    }
    if(max!=undefined && valueToSaturate > max){
        return max;
    }
    return valueToSaturate;
}

/**
 * Check and try to parse to int a string value
 * @param valueStr value to parse
 * @param defaultValue default value, if the string can not be parse
 * @returns value parse
 */
export function checkAndParseInt(valueStr: string, defaultValue: number): number {
    let value = Number.parseInt(valueStr);
    if(Number.isNaN(value)){
        return defaultValue;
    }
    return value;
}