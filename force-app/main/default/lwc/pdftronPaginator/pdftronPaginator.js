import { LightningElement, api } from 'lwc';

export default class PdftronPaginator extends LightningElement {

    @api isLoading = false;

    previousHandler() {
        this.dispatchEvent(new CustomEvent('previous'));
    }
    
    fileHandler() {
        this.dispatchEvent(new CustomEvent('file'));
    }

    nextHandler() {
        this.dispatchEvent(new CustomEvent('next'));
    }
}