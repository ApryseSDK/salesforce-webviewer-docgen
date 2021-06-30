import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import retrieveContentVersion from '@salesforce/apex/PDFTron_ContentVersionController.retrieveContentVersion';
import { fireEvent } from 'c/pubsub';

const columns = [
    { label: 'Name', fieldName: 'Title' },
    { label: 'Type', fieldName: 'FileExtension' },
];

export default class PdftronFileDataTable extends LightningElement {
    @wire(CurrentPageReference) pageRef;

    isLoading = false;

    @track page = 1; //this will initialize 1st page
    @track items = []; //it contains all the records.
    @track data = []; //data to be displayed in the table
    @track columns; //holds column info.
    @track startingRecord = 1; //start record position per page
    @track endingRecord = 0; //end record position per page
    @track pageSize = 5; //default value we are assigning
    @track totalRecountCount = 0; //total record count received from all retrieved records
    @track totalPage = 0; //total number of page is needed to display all records

    @track selectedRows;


    @wire(retrieveContentVersion)
    wiredFiles({ error, data }) {
        if (data) {
            this.items = data;
            this.totalRecountCount = data.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            this.data = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
            this.columns = columns;

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.data = undefined;
        }
    }

    previousHandler() {
        this.isLoading = true;
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordPerPage(this.page);
        }
        this.isLoading = false;
    }

    nextHandler() {
        this.isLoading = true;
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.displayRecordPerPage(this.page);
        }
        this.isLoading = false;
    }

    fileHandler() {
        this.isLoading = true;
        let el = this.template.querySelector('lightning-datatable');
        console.log("el",el);

        
        let selected = el.getSelectedRows();
        console.log("selected",JSON.stringify(selected));
        
        let selectedIds = [];

        selected.forEach((element) => {
            selectedIds.push(element.Id); 
        });

        console.log("selectedIds", selectedIds)
        fireEvent(this.pageRef, 'fileIdsSelected', JSON.stringify(selectedIds));
        this.isLoading = false;
    }

    //this method displays records page by page
    displayRecordPerPage(page) {
        this.startingRecord = ((page - 1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount)
            ? this.totalRecountCount : this.endingRecord;

        this.data = this.items.slice(this.startingRecord, this.endingRecord);

        this.startingRecord = this.startingRecord + 1;
    }
}