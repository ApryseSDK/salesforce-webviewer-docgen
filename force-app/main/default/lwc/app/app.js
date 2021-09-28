/*
 * @File Name          : app.js
 * @Description        : Parent most component where custom-datatable will be embedded. 
 * @Author             : Akshay Poddar
 * @Last Modified On   : 29/6/2020, 8:02:44 pm
**/
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    //Sample hard-coded data to demonstrate how to structure (generate) data for custom columns
    toggleExampleData = [
        {Id: 1, isSelected: true, name: 'Google', website: 'https://google.com'},
        {Id: 2, isSelected: false, name: 'Facebook', website: 'https://facebook.com'},
        {Id: 3, isSelected: true, name: 'DevLife', website: 'https://devlife.tech'},
        {Id: 4, isSelected: false, name: 'Gmail', website: 'https://gmail.com', isDisabled: true}
    ];
    //Sample hard-coded column data to demonstrate how to structure (generate) column data for custom columns
    toggleExampleColumns = [
        { label: 'Custom Buttons', fieldName: 'isSelected', type: 'toggleButton',
            typeAttributes: { 
                buttonDisabled: { fieldName: 'isDisabled' }, 
                rowId: { fieldName: 'Id' }, 
            }
        },
        { label: 'Service', fieldName: 'name', iconName: 'custom:custom18' },
        { label: 'Website', fieldName: 'website', type: 'url', iconName: 'custom:custom20' },
    ];

    //Handler for custom column interations - like handle what to do when toggle button is pressed
    handleSelectedRec(event){
        console.log(event.detail.value);
        //Write your logic to handle button interations
    }
}