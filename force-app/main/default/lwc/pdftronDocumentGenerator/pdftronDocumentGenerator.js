import { LightningElement, track, api,wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';


export default class PdftronDocumentGenerator extends LightningElement {
    columns;
    @track showTable = false;
    @track value;
    @track rows = [];
    @track values = [];
    mapping = {};

    @wire(CurrentPageReference)
    pageRef;

    connectedCallback() {
        registerListener('doc_gen_options', this.handleOptions, this);
        this.columns = [
            { "label" : "Template Key", "apiName" : "templateKey","fieldType":"text","objectName":"Account" },
            { "label" : "Value", "apiName" : "Value" ,"fieldType":"text","objectName":"Account"}
        ];
    }

    renderedCallback() {
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    }

    handleOptions(keys) {
        if(!keys) {
            this.showTable = false;
            return;
        }
        this.rows = [];
        this.showTable = true;
        for(const i in keys) {
            this.rows = [...this.rows, {uuid: this.createUUID(), templateKey: keys[i], placeholder: `Replace {{${keys[i]}}}`}]
        }
    }

    handleChange(event) {
        this.mapping[event.target.dataset.key] = event.target.value;
    }

    handleFill() {
        fireEvent(this.pageRef, 'doc_gen_mapping', this.mapping);
    }

}