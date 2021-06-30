import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
import getAttachments from "@salesforce/apex/PDFTron_ContentVersionController.getAttachments";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
