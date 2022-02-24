import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
// import getAttachments from "@salesforce/apex/PDFTron_ContentVersionController.getAttachments";
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import apexSearch from '@salesforce/apex/PDFTron_ContentVersionController.search';
import getSObjects from '@salesforce/apex/PDFTron_ContentVersionController.getSObjects';
import getObjectFields from '@salesforce/apex/PDFTron_ContentVersionController.getObjectFields';
import searchSOSL from '@salesforce/apex/PDFTron_ContentVersionController.searchSOSL'
import templateSearch from '@salesforce/apex/PDFTron_ContentVersionController.getTemplateMappingResults';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';

const FIELDS = [
    'PDFTron_Template_Mapping__mdt.Mapping__c',
    'PDFTron_Template_Mapping__mdt.sObject__c',
    'PDFTron_Template_Mapping__mdt.Template_Id__c',
    'PDFTron_Template_Mapping__mdt.Template_Name__c'
];

export default class PdftronBulkTemplateGenerator extends LightningElement {
    // just show docx files
    @api recordId;

    

    documentsRetrieved = false;
    @track loadFinished = false;
    @wire(CurrentPageReference) pageRef;
    @track results;
    @track templateAttachments = [];
    @track attachments = [];
    @track sObjects = []
    @track sObjectsFields = []

    connectedCallback () {
        this.initLookupDefaultResults();
    }

    renderedCallback () {
        if (!this.documentsRetrieved) {
          templateSearch()
            .then(data => {
              this.templateAttachments = data
              console.log(data);
              this.initLookupDefaultResults()
    
              this.error = undefined
              this.loadFinished = true
              this.documentsRetrieved = true
            })
            .catch(error => {
              console.error(error)
              this.showNotification('Error', error, 'error')
              this.error = error
            })
        }
    }

    initLookupDefaultResults () {
        // Make sure that the lookup is present and if so, set its default results
        const lookup = this.template.querySelector('.lookupTemplate');
        if (lookup) {
          lookup.setDefaultResults(JSON.parse(JSON.stringify(this.templateAttachments)));
        }
    }


    handleTemplateSearch(event) {
        const lookupElement = event.target;
        if(this.templateAttachments.length > 0){
            let results = this.templateAttachments.filter(word => {
                return word.title.toLowerCase().includes(event.detail.searchTerm.toLowerCase());
            });
            lookupElement.setSearchResults(results);
        } else {
            lookupElement.setSearchResults([]);
        }
    }

    handleSingleSelectionChange(event) {

        if (event.detail.length < 1) {
            return;
        }

        this.isLoading = true;
        console.log(event.detail[0]);

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

    handleSearch (event) {
        const lookupElement = event.target
        searchSOSL(event.detail)
          .then(results => {
            console.log('searchResults', results)
            lookupElement.setSearchResults(results)
          })
          .catch(error => {
            // TODO: handle error
            this.error = error
            console.error(error)
            let def_message =
              'We have encountered an error while searching your file. '
    
            this.showNotification(
              'Error',
              def_message + error.body.message,
              'error'
            )
          })
      }

    // @wire(getSObjects)
    // attachments ({ error, data }) {
    //     if (data) {
    //     data.forEach(object => {
    //         let option = {
    //         label: object,
    //         value: object
    //         }
    //         this.sObjects = [...this.sObjects, option]
    //     })
    //     error = undefined
    //     } else if (error) {
    //     console.error(error)
    //     this.error = error

    //     this.showNotification('Error', error.body.message, 'error')
    //     }
    // }

    handleSObjectChange (event) {
        this.selectedObject = event.detail.value
        console.log('this.selectedObject', this.selectedObject)
    
        getObjectFields({ objectName: this.selectedObject })
            .then(data => {
                this.sObjectFields = []
                data.forEach(field => {
                let option = {
                    label: field,
                    value: field
                }
                this.sObjectFields = [...this.sObjectFields, option]
                })
            })
            .catch(error => {
                alert(error.body)
                console.error(error)
            })
    }

    handleSingleSelectionChange (event) {
        if (event.detail.length < 1) {
          this.recordSearched = false
          this.recordId = ''
          this.selectedObject = ''
          return
        }
    
        const selection = this.template.querySelector('.lookupRecord').getSelection()
    
        this.recordSearched = true
    
        this.recordId = selection[0].id
        this.selectedObject = selection[0].sObjectType
    
        getObjectFields({ objectName: this.selectedObject })
            .then(data => {
                this.sObjectFields = []
                data.forEach(field => {
                let option = {
                    label: field,
                    value: field
                }
                this.sObjectFields = [...this.sObjectFields, option]
                })
            })
            .catch(error => {
                console.error(error)
            })
    }

}