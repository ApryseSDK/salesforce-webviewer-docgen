import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import queryRecords from '@salesforce/apex/PDFTron_ContentVersionController.queryRecords';
import templateSearch from '@salesforce/apex/PDFTron_ContentVersionController.getTemplateMappingResults';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';




export default class PdftronBulkTemplateGenerator extends LightningElement {
    // just show docx files
    @api recordId;

    

    documentsRetrieved = false;
    @track loadFinished = false;
    @wire(CurrentPageReference) pageRef;
    @track results;
    @track templateAttachments = [];
    @track attachments = [];
    soqlText = '';
    keys;

    columns;
    data; 
    showTable = false;

    actions = [
        {label: 'Preview', name: 'preview'}
    ]

  

    connectedCallback () {
        registerListener('doc_gen_options', this.handleOptions, this);
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
    
    handleSOQLQuery (event) {
        this.soqlText = event.target.value;
    }

    handleClick () {

        if (this.soqlText !== '' && this.keys !== ''){
            queryRecords({query: this.soqlText, objectName: this.removeSObject(this.soqlText), fields: this.keys})
                .then(result => {
                    const labels = new Set();
                    this.columns = [];

                    result.forEach(item => {
                        for(const [key] of Object.entries(item)){
                            labels.add(key)
                        }
                    })
                    
                    console.log(result);

                    labels.forEach(key => {
                        this.columns.push({
                            label: key,
                            fieldName: key
                        })
                    })

                    this.columns.push({
                        type: 'action',
                        typeAttributes: {rowActions: this.actions}
                    })

                    this.data = result;
                    this.showTable = true;
                })
                .catch(error => {
                    this.showTable = false;
                    console.error(error);
                })
        }
    }

    removeSObject (item) {
        let queryArray = item.toLowerCase().split(' ');
        let index = queryArray.findIndex(num => num === 'from');
        return queryArray[index + 1];
    }
        
    // SELECT Name FROM Contact WHERE name like '%j%' LIMIT 5

    handleOptions(keys){
        this.keys = keys;
    }

    handleRowAction(event){
        var row = JSON.parse(JSON.stringify(event.detail.row));
        var hashmap = {};
        var copyKeys = this.keys.map(element => {
             return element.toLowerCase()
            });

        for (const [key, value] of Object.entries(row)){
            if (copyKeys.includes(key.toLowerCase())) {
                var index = copyKeys.indexOf(key.toLowerCase())
                hashmap[this.keys[index]] = value;
            } else if (key === "Id") {
                hashmap['Id'] = value
            }
        }

        console.log(hashmap);


        fireEvent(this.pageRef, 'doc_gen_mapping', hashmap);
        console.log(row);
    }
}