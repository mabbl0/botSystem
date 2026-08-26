import { Interaction } from "../communication/interaction";
import { TextMsgComponent } from "../communication/message-component/basic-message-component";
import { Button } from "../communication/message-component/button";
import { ButtonRow } from "../communication/message-component/button-row";
import { MessageComponent } from "../communication/message-component/message-component";


export class Book<DataType extends {toString?(): string}> {
    /** the data to print */
    dataArray: DataType[]
    /** nb data per page */
    readonly dataPerPage: number
    /** nb maximum pages */
    readonly nbPageMax: number
    /** current pages */
    currentPageIndex: number = 0

    private msgComponent: MessageComponent
    private txtPage: TextMsgComponent
    private buttonRow: ButtonRow

    constructor(msgComponent: MessageComponent, dataArray: DataType[], dataPerPage: number = 8) {
        this.dataArray = dataArray;
        this.dataPerPage = dataPerPage;
        this.nbPageMax = 0;
        for (let i = 0 ; i < this.dataArray.length ; i += this.dataPerPage) {
            this.nbPageMax += 1;
        }

        this.msgComponent = msgComponent;
        this.txtPage = msgComponent.addText(this.showPage(0));
        this.buttonRow = msgComponent.addButtonRow([
            {label: "<-", interactionFct: this.goToLeftButton.bind(this), option: {disable: true}},
            {label: "->", interactionFct: this.gotToRightButton.bind(this)}
        ])
    }


    showPage(pageToShow: number): string {
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
            strToShowed += this.dataArray[i].toString != undefined ?
                (this.dataArray[i] as {toString(): string}).toString() : this.dataArray[i];
            strToShowed += '\n';
        }
        strToShowed += pageToShow+1 + '/' + this.nbPageMax;
        return strToShowed;
    }


    private goToLeftButton(interaction: Interaction, button: Button) {
        if(this.currentPageIndex <= 0) {
            // should not be here
            button.option.disable = true;
            button.adapt();
            interaction.edit(this.msgComponent);
            return;
        }
        else if(this.currentPageIndex == 1){
            button.option.disable = true;
            button.adapt();
        }
        else if(this.currentPageIndex == this.nbPageMax-1) {
            this.buttonRow.buttons[1].option.disable = false;
            this.buttonRow.buttons[1].adapt();
        }
        this.currentPageIndex += -1;

        this.txtPage.text = this.showPage(this.currentPageIndex);
        this.txtPage.adapt();

        interaction.edit(this.msgComponent);
    }

    private gotToRightButton(interaction: Interaction, button: Button) {
        if(this.currentPageIndex >= this.nbPageMax-1) {
            // should not be here
            button.option.disable = true;
            button.adapt();
            interaction.edit(this.msgComponent);
            return;
        }
        else if(this.currentPageIndex == this.nbPageMax-2){
            button.option.disable = true;
            button.adapt();
        }
        else if(this.currentPageIndex == 0) {
            this.buttonRow.buttons[0].option.disable = false;
            this.buttonRow.buttons[0].adapt();
        }
        this.currentPageIndex += 1;

        this.txtPage.text = this.showPage(this.currentPageIndex);
        this.txtPage.adapt();

        interaction.edit(this.msgComponent);
    }
}