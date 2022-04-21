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
    checkbox_field = [];
    get checkbox_option() {
        return this.checkbox_field;  
    }

    sortphrase;
    sortfield_value;
    sortalpha_value = 'ASC';
    sortalpha_fields = [
        {label: 'A to Z', value: 'ASC'},
        {label: 'Z to A', value: 'DESC'}
    ]
    sortnull_value = 'NULLS FIRST';
    sortnull_fields = [
        {label: 'Nulls First', value: 'NULLS FIRST'},
        {label: 'Nulls Last', value: 'NULLS LAST'}
    ]

    limit_value = '';

    filterphrase;
    filterfield_value;
    filtertext_value;
    filtercompare_value = '=';
    filtercompare_fields = [
        {label: '=', value: '='},
        {label: '≠', value: '!='},
        {label: '<', value: '<'},
        {label: '≤', value: '<='},
        {label: '>', value: '>'},
        {label: '≥', value: '>='},
        {label: 'starts with', value: 'starts'},
        {label: 'ends with', value: 'ends'},
        {label: 'contains', value: 'contains'},
        {label: 'in', value: 'IN'},
        {label: 'not in', value: 'NOT IN'},
        {label: 'includes', value: 'INCLUDES'},
        {label: 'excludes', value: 'EXCLUDES'}
    ]

    documentsRetrieved = false;
    isLoading = true;

    @wire(CurrentPageReference) pageRef;
    
    

    soqlText = '';
    keys;

    lookup_results;
    template_results;

    sObject;
    sObject_options;
    sTemplate;
    sFields;
    
    

    
    columns;
    data; 
    showTable = false;
    selectedRows;

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
            if (item.Id === event.target.getSelection()[0].id){
                this.checkbox_field = [];
                this.sTemplate = item;
                const checkbox_results = new Set();
                Object.keys(JSON.parse(item.Mapping__c)).forEach(e =>{
                    checkbox_results.add(e);
                });
                
                checkbox_results.forEach(x => {
                    this.checkbox_field.push(
                        {label: x, value: x}
                    );
                });
                this.checkbox_value = this.checkbox_field[0].label;
                this.sObject = this.sTemplate.sObject__c;
                this.soqlText = 'SELECT ' + this.checkbox_value + ' FROM ' + this.sObject; 
            }
        })
        


        getFileDataFromId({ Id: this.sTemplate.Template_Id__c })
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
        
        
        getObjectFields({ objectName: this.sTemplate.sObject__c })
            .then(data => {
                this.sFields = [
                    {label: 'Deselect', value: ''}
                ]
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
    
    


    handleClick () {
        if (this.soqlText !== ''){
            queryRecords({query: this.soqlText})
                .then(result => {
                    const labels = new Set();
                    this.columns = [];

                    result.forEach(item => {
                        for(const [key] of Object.entries(item)){
                            labels.add(key)
                        }
                    })
                    
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
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }



    // Query Builiding Section
    // Checkbox: handles the fields selected for the SOQL query
    // Sort: Orders the SOQL Query results
    // Limit: Limits the records requested
    // Filter: Specify results with filters

    handleCheckboxChange(event) {
        this.checkbox_value = event.detail.value;
        this.buildQuery();
    }

    
    handleSortField(event){
        this.sortfield_value = event.detail.value;
        this.buildSortPhrase(); 
    }
    handleSortAlpha(event){
        this.sortalpha_value = event.detail.value;
        this.buildSortPhrase();
    }
    handleSortNull(event){
        this.sortnull_value = event.detail.value;
        this.buildSortPhrase();
    }
    buildSortPhrase(){
        if (this.sortfield_value){
            this.sortphrase = this.sortfield_value + ' ' + this.sortalpha_value + ' ' + this.sortnull_value;
        } else {
            this.sortphrase = '';
        }
        this.buildQuery();
    }

    handleLimitChange(event){
        this.limit_value = event.detail.value;
        this.buildQuery();
    }


    handleFilterField(event){ 
        this.filterfield_value = event.detail.value; 
        this.buildFilterPhrase();
    }

    handleFilterCompare(event){
        this.filtercompare_value = event.detail.value;
        this.buildFilterPhrase();
    }

    handleFilterText(event){
        this.filtertext_value = event.detail.value;
        this.buildFilterPhrase();
    }  

    
    buildFilterPhrase(){
        if (this.filterfield_value && this.filtertext_value){
            this.filterphrase = this.filterfield_value + ' ';
            switch(this.filtercompare_value){
                case '=':
                case '!=': 
                case '<':
                case '<=':
                case '>':
                case '>=':
                    this.filterphrase += this.filtercompare_value + ' \'' + this.filtertext_value + '\'';
                    break;
                case 'starts':
                    this.filterphrase += 'LIKE \'\%' + this.filtertext_value + '\'';
                    break;
                case 'ends':
                    this.filterphrase += 'LIKE \'' + this.filtertext_value + '\%\'';
                    break;
                case 'contains':
                    this.filterphrase += 'LIKE \'\%' + this.filtertext_value + '\%\'';
                    break;
                case 'IN':
                case 'NOT IN':
                case 'INCLUDES':
                case 'EXCLUDES':
                    this.filterphrase += this.filtercompare_value + ' \(' + this.filtertext_value + '\)';
                    break;
            }
        } else {
            this.filterphrase = '';
        }
        this.buildQuery();
        
    }


    buildQuery(){
        let array_checkbox = [this.checkbox_value];
        let limit_results = (this.limit_value) ? ' LIMIT ' + this.limit_value : '';
        let sort_results = (this.sortphrase) ? ' ORDER BY ' + this.sortphrase : '';
        let filter_results = (this.filterphrase) ? ' WHERE ' + this.filterphrase : '';
        let fields = array_checkbox.join(', ');

        this.soqlText = 'SELECT ' + fields + ' FROM ' + this.sObject + filter_results + sort_results + limit_results;
    }

    handleGenerate(){
        let template_mapping = JSON.parse(this.sTemplate.Mapping__c);
        this.selectedRows.forEach(item => {
            let mapping = {};
            for(const field in item){
                mapping[(field === 'Id') ? 'Id' : template_mapping[field]] = item[field];
            }
            console.log(mapping);
        })
    }

    handleSelectedRow(event){
        this.selectedRows = event.detail.selectedRows;
    }
}