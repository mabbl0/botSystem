
// get the string number with a 0 if needeed
function strNumAdd0(num: number): string {
    if (num < 10) {
        return "0" + num;
    } else {
        return num.toString();
    }
}

/**
 * get a date with the "dd/mm[/yy]" format
 * @param date date to obtain the string
 * @param noYear indicate to add the year to the format
 * @returns the string the great format
 */
export function dateOnlyStr(date: Date, noYear?: boolean) {
    return strNumAdd0(date.getDate()) + "/" + strNumAdd0(date.getMonth() + 1) + (noYear ? '' : "/" + strNumAdd0(date.getFullYear() % 100));
}

/**
 * get a date with the "dd/mm/yy [at] hh:mm:ss" format
 * @param date date to obtain the string
 * @param addAt indicate to add or not the 'at'
 * @returns the string the great format
 */
export function dateStr(date: Date, addAt?: boolean) {
    return strNumAdd0(date.getDate()) + "/" + strNumAdd0(date.getMonth() + 1) + "/" + strNumAdd0(date.getFullYear() % 100) +
        (addAt ? ' at' : '') +
        " " + strNumAdd0(date.getHours()) + ":" + strNumAdd0(date.getMinutes()) + ":" + strNumAdd0(date.getSeconds());
}

/**
 * get the date now in the "dd/mm/yy [at] hh:mm:ss" format
 * @param addAt indicate to add or not the 'at'
 * @returns the string the great format
 */
export function nowDateStr(addAt?: boolean): string {
    return dateStr(new Date(Date.now()), addAt);
}

/**
 * Parse a date to ms date since 1970  
 * @param dateStr date in "dd/mm/yy" or "dd/mm/yyyy" format
 * @param hourStr hour in "hh:mm" format
 * @param defaultHours default hour if the hoursStr is not indicate
 * @param defaultMinutes default minutes if the hoursStr is not indicate
 * @returns the date, undefined if error format
 */
export function parseDate(dateStr: string, hourStr?: string, defaultHours?: number, defaultMinutes?: number): Date {
    let dateSplit = dateStr.split('/');
    if (dateSplit.length != 3) {
        return undefined;
    }
    if (dateSplit[0].length == 0 || dateSplit[1].length == 0 || dateSplit[2].length == 0 ||
        dateSplit[0].length > 2 || dateSplit[1].length > 2 || dateSplit[2].length > 4) {
        return undefined;
    }

    let hours = defaultHours;
    let minutes = defaultMinutes;
    if (hourStr != undefined) {
        let hourSplit = hourStr.split(':');
        if (hourSplit.length != 2) {
            return undefined;
        }
        if (hourSplit[0].length == 0 || hourSplit[1].length == 0 ||
            hourSplit[0].length > 2 || hourSplit[1].length > 2) {
            return undefined;
        }
        hours = parseInt(hourSplit[0]);
        minutes = parseInt(hourSplit[1]);
    }
    else if (hours == undefined || minutes == undefined) {
        return undefined;
    }

    let day = parseInt(dateSplit[0]);
    let month = parseInt(dateSplit[1]) - 1;
    let year = parseInt(dateSplit[2]);
    if (dateSplit[2].length != 4) {
        year += 2000;
    }
    return new Date(year, month, day, hours, minutes);
}


/**
 * get a date with the literal month format: "MMMM [yy]"
 * @param date date to obtain the string
 * @param year indicate to add or not the year
 * @returns the string to the great format
 */
export function monthStr(date: Date, year?: boolean): string {
    let strToReturn: string;
    switch (date.getMonth()) {
        case 0:
            strToReturn = 'janvier';
            break;
        case 1:
            strToReturn = 'frévrier';
            break;
        case 2:
            strToReturn = 'mars';
            break;
        case 3:
            strToReturn = 'avril';
            break;
        case 4:
            strToReturn = 'mai';
            break;
        case 5:
            strToReturn = 'juin';
            break;
        case 6:
            strToReturn = 'juillet';
            break;
        case 7:
            strToReturn = 'août';
            break;
        case 8:
            strToReturn = 'septembre';
            break;
        case 9:
            strToReturn = 'octobre';
            break;
        case 10:
            strToReturn = 'novembre';
            break;
        case 11:
            strToReturn = 'decembre';
            break;
        default:
            strToReturn = '';
            break;
    }
    if (year) {
        return strToReturn + ' ' + strNumAdd0(date.getFullYear() % 100);
    }
    return strToReturn;
}

/**
 * get a date with the literal day format: "ddddd [dd/mm[/yy]]"
 * @param date date to obtain the string
 * @param withDate indicate to add or not the date
 * @param noYear indicate to add the year to the format
 * @returns the string to the great format
 */
export function dayStr(date: Date, withDate?: boolean, noYear?: boolean) {
    let strToReturn: string;
    switch (date.getDay()) {
        case 1:
            strToReturn = 'lundi';
            break;
        case 2:
            strToReturn = 'mardi';
            break;
        case 3:
            strToReturn = 'mercredi';
            break;
        case 4:
            strToReturn = 'jeudi';
            break;
        case 5:
            strToReturn = 'vendredi';
            break;
        case 6:
            strToReturn = 'samedi';
            break;
        case 0:
            strToReturn = 'dimanche';
            break;
        default:
            strToReturn = '';
            break;
    }
    if (withDate) {
        return strToReturn + ' ' + dateOnlyStr(date, noYear);
    }
    return strToReturn;
}

/**
 * @param date the date to process
 * @returns the part of the day in string
 */
export function partDayStr(date: Date): string {
    return getPartDayStr( getPartDayNum(date) );
}

/**
 * @param date the date to process
 * @returns the part of the day in number (0: morning ; 1: afternoon ; 2: evening)
 */
export function getPartDayNum(date: Date): number {
    let hours = date.getHours();
    if (hours < 12) {
        return 0;
    }
    else if (hours < 18) {
        return 1;
    }
    return 2;
}

/**
 * @param partDayNum the part of the day in number (0: morning ; 1: afternoon ; 2: evening)
 * @returns the part of the day in string
 */
export function getPartDayStr(partDayNum: number): string {
    switch (partDayNum%3) {
        case 0:
            return 'matin';
        case 1:
            return 'après midi';
        case 2:
            return 'soir';
        default:
            return '';
    }
}

/**
 * @param partDayNum the part of the day in number (0: morning ; 1: afternoon ; 2: evening)
 * @returns hours start of the part of the day
 */
export function getPartDayHoursStart(partDayNum: number): number {
    switch (partDayNum%3) {
        case 0:
        default:
            return 0;
        case 1:
            return 12;
        case 2:
            return 18;
    }
}

/**
 * set the date time the start of the indicate part day or its own part day
 * @param date the date to set
 * @param partDayNum the part of the day in number (0: morning ; 1: afternoon ; 2: evening)
 */
export function setStartPartDay(date: Date, partDayNum?: number) {
    switch ( partDayNum!=undefined ? (partDayNum%3) : getPartDayNum(date) ) {
        case 0: // morning
            date.setHours(0, 0, 0, 0);
            break;
        case 1: // afternoon
            date.setHours(12, 0, 0, 0);
            break;
        case 2: // evening
            date.setHours(18, 0, 0, 0);
            break;
    }
}

/**
 * set the date time the end of the indicate part day or its own part day
 * @param date the date to set
 * @param partDayNum the part of the day in number (0: morning ; 1: afternoon ; 2: evening)
 */
export function setEndPartDay(date: Date, partDayNum?: number) {
    switch ( partDayNum!=undefined ? (partDayNum%3) : getPartDayNum(date) ) {
        case 0: // morning
            date.setHours(12, 0, 0, 0);
            break;
        case 1: // afternoon
            date.setHours(18, 0, 0, 0);
            break;
        case 2: // evening
            date.setHours(24, 0, 0, 0);
            break;
    }
}