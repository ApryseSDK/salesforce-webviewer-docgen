import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
import getAttachments from "@salesforce/apex/PDFTron_ContentVersionController.getAttachments";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import apexSearch from '@salesforce/apex/PDFTron_ContentVersionController.search';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';

export default class PdftronAttachmentPickerCombobox extends LightningElement {
    error;

    @track value = '';
    @track picklistOptions = [];
    @track loadFinished = false;
    @api recordId;
    @wire(CurrentPageReference) pageRef;

    @track results;

    @wire(getAttachments, {recordId: "$recordId"}) 
    attachments({error, data}) {
        if(data) {
            this.results = data;
            error = undefined;
        } else if (error) {
            console.error(error);
            this.error = error;

            this.showNotification('Error', error.body.message, 'error');
        }
    };

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
        this.checkForErrors();

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

    connectedCallback() {
        if(this.results.length > 0) {
            //postMessage
        }
    }
    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    handleChange(event) {
        this.value = event.detail.value;
        fireEvent(this.pageRef, 'blobSelected', this.value);
    }
}
