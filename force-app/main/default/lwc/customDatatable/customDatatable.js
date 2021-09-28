/*
 * @File Name          : customDatatable.js
 * @Description        : Common JS for all custom data type HTML templates, Contains 
 *                       logic to define custom data type and link with html template.
 * @Author             : Akshay Poddar
 * @Last Modified On   : 29/6/2020, 8:02:44 pm
**/
import LightningDatatable from 'lightning/datatable';
import toggleButtonColumnTemplate from './toggleButtonColumnTemplate.html';
import richTextColumnTemplate from './richTextColumnTemplate.html';
//import iconColumnTemplate from './iconColumnTemplate.html';

export default class CustomDatatable extends LightningDatatable {
    static customTypes = {
        toggleButton: {
            template: toggleButtonColumnTemplate,
            standardCellLayout: true,
            typeAttributes: ['buttonDisabled', 'rowId'],
        }
    };
    //documentInfo sample array
    let documentInfo = 
    [
        { documentName: "first_file.pdf", pageRange: "1-4", path: "https://link.to.azure/folder/filepath/first_file.pdf" },
        { documentName: "second_file.pdf", pageRange: "5-9", path: "https://link.to.azure/folder/filepath/second_file.pdf" },
        //etc 
    ];

}