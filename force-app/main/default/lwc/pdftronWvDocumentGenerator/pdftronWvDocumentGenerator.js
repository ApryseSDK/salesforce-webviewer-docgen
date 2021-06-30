import { LightningElement, api } from 'lwc';

export default class PdftronWvDocumentGenerator extends LightningElement {
    @api record;
    @api field;
    @api fieldType;
    @api type;
    value;
    label;
    connectedCallback() {
        this.value = this.record[this.field];
        this.label = this.field;
        this.type='text';
    }

    handleInputChange(event) {
        this.value = event.target.value; 
    }

    @api
    inputValue() {
        return { value : this.value, field: this.field };
    }
    get isText() {
        if(this.fieldType)
        {
            return this.fieldType.toLowerCase()=='text';
        }
        return false;
      }
}