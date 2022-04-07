import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import queryRecords from '@salesforce/apex/PDFTron_ContentVersionController.queryRecords';
import templateSearch from '@salesforce/apex/PDFTron_ContentVersionController.getTemplateMappingResults';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';
import getSObjects from '@salesforce/apex/PDFTron_ContentVersionController.getSObjects';
import getObjectFields from '@salesforce/apex/PDFTron_ContentVersionController.getObjectFields'



export default class PdftronBulkTemplateGenerator extends LightningElement {
    // just show docx files
    @api recordId;

    checkbox_value = 'test';
    checkbox_field = [
        {label: 'test', value: 'test'}
    ];  

    alpha_value = ['a'];
    alpha_fields = [
        {label: 'A to Z', value: 'a'},
        {label: 'Z to A', value: 'z'}
    ]

    null_value = ['first']
    null_fields = [
        {label: 'Nulls First', value: 'first'},
        {label: 'Nulls Last', value: 'last'}
    ]

    compare_value = ['=']
    compare_fields = [
        {label: '=', value: '='},
        {label: '≠', value: '≠'},
        {label: '<', value: '<'},
        {label: '≤', value: '≤'},
        {label: '>', value: '>'},
        {label: '≥', value: '≥'},
        {label: 'starts with', value: 'starts'},
        {label: 'ends with', value: 'ends'},
        {label: 'contains', value: 'contains'},
        {label: 'in', value: 'in'},
        {label: 'not in', value: 'not in'},
        {label: 'includes', value: 'includes'},
        {label: 'excludes', value: 'excludes'}
    ]

    documentsRetrieved = false;
    isLoading = true;

    @wire(CurrentPageReference) pageRef;
    
    

    soqlText = '';
    keys;

    sObject;
    sObject_options;
    sTemplate;
    sFields;
    lookup_results;
    template_results;
    

    
    columns;
    data; 
    showTable = false;

    actions = [
        {label: 'Preview', name: 'preview'}
    ]

    
    @wire(getSObjects)
    attachments ({ error, data }) {
        if (data) {
            this.sObject_options = [];
            data.forEach(object => {
                let option = {
                    label: object,
                    value: object
                }
                this.sObject_options = [...this.sObject_options, option]
            })
            error = undefined
        } else if (error) {
            console.error(error)
            this.error = error

            this.showNotification('Error', error.body.message, 'error')
        }
    }

    connectedCallback () {
        registerListener('doc_gen_options', this.handleOptions, this);
        this.initLookupDefaultResults();
    }

    renderedCallback () {
        if (!this.documentsRetrieved) {
          templateSearch()
            .then(data => {
              let lookup = [];
              let templates = [];

              data.forEach((item) => {
                lookup.push(item.lookup);
                templates.push(item.template);
              })

              this.lookup_results = lookup;
              this.template_results = templates;
              this.initLookupDefaultResults()
    
              this.error = undefined
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
          lookup.setDefaultResults(JSON.parse(JSON.stringify(this.lookup_results)));
        }
    }


    handleTemplateSearch(event) {
        const lookupElement = event.target;
        if(this.lookup_results.length > 0){
            let results = this.lookup_results.filter(word => {
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

        this.template_results.forEach(item => {
            this.checkbox_field = [];
            if (item.Id === event.target.getSelection()[0].id){
                this.sTemplate = item;
                const checkbox_results = new Set();
                Object.keys(JSON.parse(item.PDFtron_WVDC__Mapping__c)).forEach(e =>{
                    checkbox_results.add(e);
                });
                checkbox_results.forEach(x => {
                    this.checkbox_field.push(
                        {label: x, value: x}
                    );
                });
                this.checkbox_value = this.checkbox_field[0].label;
                const startSelect = this.template.querySelector('.objectCombobox');
                this.sObject = this.sTemplate.PDFtron_WVDC__sObject__c;
                
            }
        })
        


        getFileDataFromId({ Id: this.sTemplate.PDFtron_WVDC__Template_Id__c })
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
        
        
        getObjectFields({ objectName: this.sTemplate.PDFtron_WVDC__sObject__c })
        .then(data => {
            this.sFields = []
            data.forEach(field => {
                let option = {
                    label: field,
                    value: field
                }
                this.sFields = [...this.sFields, option]
            })
        })
        .catch(error => {
            alert(error.body)
            console.error(error)
        })
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

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    handleCheckboxChange() {

    }
}