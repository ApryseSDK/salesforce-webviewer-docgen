import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
//import getPickList from '@salesforce/apex/PDFTron_ContentVersionController.getPickList';


export default class PdftronInputPickListCell extends LightningElement {
    @track options = [];
    value;
    @api record;
    @api field;
    @api fieldType;
    @api objectName;

    @wire(CurrentPageReference)
    pageRef;

    value;
    label;
    connectedCallback() {
        this.value = this.record[this.field];
        this.label = this.field;
        registerListener('doc_gen_options', this.handleOptions, this);
        /*
        if (this.objectName !== undefined && this.isPickList) {
            this.getPicklist(this.objectName, this.field);
        }*/
    }
    disconnectedCallback() {
        unregisterAllListeners(this);
    }
    getPicklist(obj, field) {
        /*
        getPickList({ objectName : obj, fieldName :field})
        .then(result => {
           if(result)
           {
                for(let i=0; i<result.length; i++) {
                    console.log('id=' + result[i]);
                    this.options = [...this.options ,{value: result[i] , label: result[i]}];                                   
                }     
                this.error = undefined;
            }
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
        });*/
    }
    handleOptions(keys) {
        console.log(`inside of handleOptions, ${JSON.stringify(keys)}`);

        for(const i in keys) {
            this.options = [...this.options, {label: keys[i], value: keys[i]}];
        }
    }
    handleChange(event) {
        this.value = event.target.value;
    }
    get isPickList() {
        if (this.fieldType) {
            return this.fieldType.toLowerCase() == 'picklist';
        }
        return false;
    }

    @api
    inputValue() {
        return { value: this.value, field: this.field };
    }
}