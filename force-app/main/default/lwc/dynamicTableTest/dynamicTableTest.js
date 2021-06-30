import { LightningElement, track,api } from 'lwc';
import createAccounts from '@salesforce/apex/PDFTron_ContentVersionController.createAccounts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns=[
    { "label" : "Field Source", "apiName" : "fieldSource","fieldType":"picklist","objectName":"Account" },
    { "label" : "Value", "apiName" : "Value" ,"fieldType":"text","objectName":"Account"}
];

export default class DynamicTableTest extends LightningElement {
   @track records;
   @api recordJson;
   @track columns=columns;
   submit(event) {
        var table = this.template.querySelector("c-dynamic-table");
        if(table!=undefined)
        {
            this.records = table.retrieveRecords();

            console.log(JSON.stringify(this.records));
            createAccounts({ accounts : this.records })
            .then(result => {
                this.message = result;
                this.error = undefined;                
                
                //this.accountRecList = [];
                if(this.message !== undefined) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Accounts Created!',
                            variant: 'success',
                        }),
                    );
                }

                console.log(JSON.stringify(result));
                console.log("result", this.message);
            })
            .catch(error => {
                this.message = undefined;
                this.error = error;
                
                console.log("error", JSON.stringify(this.error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating records',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
        }
    }
}