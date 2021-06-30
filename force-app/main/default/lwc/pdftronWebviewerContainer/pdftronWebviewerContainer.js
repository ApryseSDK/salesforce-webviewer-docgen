import { LightningElement, api, track } from 'lwc';
import { publish, createMessageContext, releaseMessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import WebViewerMC from "@salesforce/messageChannel/WebViewerMessageChannel__c";
import apexSearch from '@salesforce/apex/PDFTron_ContentVersionController.search';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';

export default class PdftronWebviewerContainer extends LightningElement {
    @api recordId;
    @track renderVideo = false;
    channel;
    context = createMessageContext();

    connectedCallback() {
        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
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

    handleSubscribe() {
        if (this.channel) {
            return;
        }
        this.channel = subscribe(this.context, WebViewerMC, (message) => {
            if (message) {
                console.log('Container received: ' + message);
                if (message.messageBody === 'Video') {
                    this.renderVideo = true;
                } else {
                    this.renderVideo = false;
                }
            }
        });
    }

    handleUnsubscribe() {
        releaseMessageContext(this.context);
        unsubscribe(this.channel);
    }
}