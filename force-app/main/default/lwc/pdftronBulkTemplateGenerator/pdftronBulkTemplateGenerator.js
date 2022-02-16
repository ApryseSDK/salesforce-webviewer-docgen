import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
// import getAttachments from "@salesforce/apex/PDFTron_ContentVersionController.getAttachments";
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import apexSearch from '@salesforce/apex/PDFTron_ContentVersionController.search';
import metaSearch from '@salesforce/apex/PDFTron_ContentVersionController.searchMetaData';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';
// import getMetaDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getMetaDataFromId';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'PDFTron_Template_Mapping__mdt.Mapping__c',
    'PDFTron_Template_Mapping__mdt.sObject__c',
    'PDFTron_Template_Mapping__mdt.Template_Id__c',
    'PDFTron_Template_Mapping__mdt.Template_Name__c'
];

export default class PdftronBulkTemplateGenerator extends LightningElement {
    // just show docx files
    @api recordId;
    @wire(getRecord, { recordId: 'm015f000001IZKGAA4', fields: FIELDS })
    metadatarecord;

    get customMetaData() {
        return JSON.stringify(this.metadatarecord.data);
    }

    


    @track loadFinished = false;
    @wire(CurrentPageReference) pageRef;
    @track results;
    @track metaAttachments;
    @track attachments;

    connectedCallback () {
        this.initLookupDefaultResults();
    }

    renderedCallback () {

    }

    initLookupDefaultResults () {
        // Make sure that the lookup is present and if so, set its default results
        const lookup = this.template.querySelector('c-lookup');
        if (lookup) {
          lookup.setDefaultResults(JSON.parse(JSON.stringify(this.attachments)));
        }
    }


    handleSearch(event) {
        const lookupElement = event.target;
        apexSearch(event.detail)
            .then(results => {
                console.log("searchResults", results);
                lookupElement.setSearchResults(results);
            })
            .catch(error => {
                // TODO: handle error
                this.error = error;
                console.error(error);
                let def_message = 'We have encountered an error while searching your file. '

                this.showNotification('Error', def_message + error.body.message, 'error');
            });
    }

    handleSingleSelectionChange(event) {
        console.log(event.detail[0]);
        // this.checkForErrors();

        if (event.detail.length < 1) {
            return;
        }


        this.isLoading = true;

        getFileDataFromId({ Id: event.detail[0] })
            .then(result => {
                fireEvent(this.pageRef, 'blobSelected', result);
                this.isLoading = false;
            })
            .catch(error => {
                // TODO: handle error
                this.error = error;
                console.error(error);
                this.isLoading = false;
                let def_message = 'We have encountered an error while handling your file. '

                this.showNotification('Error', def_message + error.body.message, 'error');
            });
    }


    handleMetaSearch(event) {
        const lookupElement = event.target;
        console.log('hello')
        metaSearch(event.detail)
            .then(results => {
                console.log("searchResults", results);
                lookupElement.setSearchResults(results);
            })
            .catch(error => {
                // TODO: handle error
                this.error = error;
                console.error(error);
                let def_message = 'We have encountered an error while searching your file. '

                this.showNotification('Error', def_message + error.body.message, 'error');
            });
    }

    // handleMetaSingleSelectionChange(event) {
    //     console.log(event.detail[0]);
    //     // this.checkForErrors();

    //     if (event.detail.length < 1) {
    //         return;
    //     }


    //     this.isLoading = true;

    //     getMetaDataFromId({ Id: event.detail[0] })
    //         .then(result => {
    //             fireEvent(this.pageRef, 'blobSelected', result);
    //             this.isLoading = false;
    //         })
    //         .catch(error => {
    //             // TODO: handle error
    //             this.error = error;
    //             console.error(error);
    //             this.isLoading = false;
    //             let def_message = 'We have encountered an error while handling your file. '

    //             this.showNotification('Error', def_message + error.body.message, 'error');
    //         });
    // }
}