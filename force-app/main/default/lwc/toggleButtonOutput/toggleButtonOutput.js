/*
 * @File Name          : toggleButtonOutput.js
 * @Description        : JS file which contains attribute declaration for custom data type 
 *                       which can be used to customize columns even further. It also contains 
 *                       code to call custom event whenever button gets clicked (interation with 
 *                       column is to be defined).
 * @Author             : Akshay Poddar
 * @Last Modified On   : 29/6/2020, 8:02:44 pm
**/
import { LightningElement, api } from 'lwc';

export default class ToggleButtonOutput extends LightningElement {
    @api checked = false;
    @api buttonDisabled = false;
    @api rowId;

    handleToggle() {
        const event = CustomEvent('selectedrec', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
                value: { rowId: this.rowId, state: event.target.checked }
            },
        });
        this.dispatchEvent(event);
    }

    get getInactiveMsg(){
        return this.buttonDisabled?'Disabled':'Not Selected';
    }
}