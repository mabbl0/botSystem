import { Interaction } from "../communication/interaction";
import { TextMsgComponent } from "../communication/message-component/basic-message-component";
import { Button } from "../communication/message-component/button";
import { ButtonRow } from "../communication/message-component/button-row";
import { MessageComponent } from "../communication/message-component/message-component";

/**
 * chapter index in a book
 */
export interface BookChapter {
    chapter: string,
    index: number
}

/**
 * Create a message with a long text
 * and buttons to cross the text
 */
export class Book<DataType extends {toString?(): string}> {
    /** the data to print */
    dataArray: DataType[]
    /** nb data per page */
    readonly dataPerPage: number
    /** chapters to split the elements */
    readonly chapters: BookChapter[] | undefined
    /** nb maximum pages */
    readonly nbPageMax: number
    /** current pages */
    currentPageIndex: number = 0

    private msgComponent: MessageComponent
    private txtPage: TextMsgComponent
    private buttonRow: ButtonRow

    /**
     * @param msgComponent the message component to change and send
     * @param tittle the book tittle
     * @param dataArray the text split in array
     * @param chapters index of the chapters
     * @param dataPerPage the number of elements by pages 
     */
    constructor(msgComponent: MessageComponent, tittle: string, dataArray: DataType[], chapters?: BookChapter[], dataPerPage: number = 8) {
        this.dataArray = dataArray;
        this.dataPerPage = dataPerPage;
        this.chapters = chapters;
        this.nbPageMax = 0;
        for (let i = 0 ; i < this.dataArray.length ; i += this.dataPerPage) {
            this.nbPageMax += 1;
        }

        this.msgComponent = msgComponent;
        msgComponent.addText("# " + tittle);
        msgComponent.addSeparator();
        this.txtPage = msgComponent.addText(this.getPage(0));
        this.buttonRow = msgComponent.addButtonRow([
            {label: "<-", interactionFct: this.goToLeftButton.bind(this), option: {disable: true}},
            {label: "->", interactionFct: this.gotToRightButton.bind(this), option: {disable: this.nbPageMax <= 1}}
        ])
    }


    /**
     * the page to show 
     */
    private getPage(pageToShow: number): string {
        let strToShowed = "";
        if(pageToShow < 0) {
            pageToShow = 0;
        }
        else if(pageToShow > this.nbPageMax-1) {
            pageToShow = this.nbPageMax-1;
        }
        
        let firstPageElem = pageToShow*this.dataPerPage;
        let lastPageElem = firstPageElem + this.dataPerPage;
        for (let i = firstPageElem ;  i < lastPageElem && i < this.dataArray.length ; i++) {
            if(this.chapters != undefined ) {
                let chapt = this.chapters.find( c => c.index == i);
                if(chapt != undefined) {
                    strToShowed += "## " + chapt.chapter + '\n';
                }
            }

            strToShowed += this.dataArray[i].toString != undefined ?
                (this.dataArray[i] as {toString(): string}).toString() : this.dataArray[i];
            strToShowed += '\n';
        }
        strToShowed += pageToShow+1 + '/' + this.nbPageMax;
        return strToShowed;
    }

    /** action after left button click */
    private goToLeftButton(interaction: Interaction, button: Button) {
        if(this.currentPageIndex <= 0) {
            // should not be here
            button.option.disable = true;
            button.adapt();
            interaction.edit(this.msgComponent);
            return;
        }
        if(this.currentPageIndex == 1){
            button.option.disable = true;
            button.adapt();
        }
        if(this.currentPageIndex == this.nbPageMax-1) {
            this.buttonRow.buttons[1].option.disable = false;
            this.buttonRow.buttons[1].adapt();
        }
        this.currentPageIndex += -1;

        this.txtPage.text = this.getPage(this.currentPageIndex);
        this.txtPage.adapt();

        interaction.edit(this.msgComponent);
    }

    /** action after right button click */
    private gotToRightButton(interaction: Interaction, button: Button) {
        if(this.currentPageIndex >= this.nbPageMax-1) {
            // should not be here
            button.option.disable = true;
            button.adapt();
            interaction.edit(this.msgComponent);
            return;
        }
        if(this.currentPageIndex == this.nbPageMax-2){
            button.option.disable = true;
            button.adapt();
        }
        if(this.currentPageIndex == 0) {
            this.buttonRow.buttons[0].option.disable = false;
            this.buttonRow.buttons[0].adapt();
        }
        this.currentPageIndex += 1;

        this.txtPage.text = this.getPage(this.currentPageIndex);
        this.txtPage.adapt();

        interaction.edit(this.msgComponent);
    }
}