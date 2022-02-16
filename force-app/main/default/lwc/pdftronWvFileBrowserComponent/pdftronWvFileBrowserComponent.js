import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
import apexSearch from '@salesforce/apex/PDFTron_ContentVersionController.search';
import getFileDataFromId from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PdftronWvFileBrowserComponent extends NavigationMixin(LightningElement) {
  error;
  errors;
  isLoading = false;
  hasRecords = false;
  isMultiEntry = false;
  maxSelectionSize = 2;


  @api hideSearch = false;
  @api hideUpload = false;
  @api hideLibrary = false;
  @api hideDocGen = false;
  @api hideTempGen = false;
  @api hideBulkTempGen = false;
  @api tabName;
  @api label;
  @api myRecordId;

  @track documentTemplate
  @track searchTerm = '';
  @track contentVersions;
  @track selectedRows;
  @wire(CurrentPageReference) pageRef;

  columns = [
    { label: 'File Name', fieldName: 'FileName', sortable: true },
    { label: 'Link', fieldName: 'FileLink' },
    {
      label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: "date", sortable: true,
      typeAttributes: {
        hour12: true,
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    },
  ];

  connectedCallback() {
  }

  log(...str) {
    console.log(JSON.parse(JSON.stringify(str)));

  }

  getSelectedName(event) {
    this.selectedRows = event.detail.selectedRows;
  }

  handleClick() {
    if (this.selectedRows) {
      let payload = JSON.stringify(this.selectedRows);
      fireEvent(this.pageRef, 'filesSelected', payload);
    }
  }

  handleDownloadClick() {
    let rows = [];
    this.selectedRows.forEach(row => {
      rows.push(row);
    });
    if (this.selectedRows) {
      let payload = JSON.stringify(rows);
      fireEvent(this.pageRef, 'downloadBlob', payload);
    }
  }

  navigateToWvInstance(row) {
    this[NavigationMixin.Navigate]({
      type: 'standard__component',
      attributes: {
        componentName: 'c__WebViewerAura'
      },
      state: {
        c__contentVersionId: row.Id,
      }
    })
  }

  handleSearch(event) {
    const lookupElement = event.target;
    apexSearch(event.detail)
      .then(results => {
        console.log("searchResults", results);
        lookupElement.setSearchResults(results);
      })
      .catch(error => {
        // TODO: handle error
        this.error = error;
        console.error(error);
        let def_message = 'We have encountered an error while searching your file. '

        this.showNotification('Error', def_message + error.body.message, 'error');
      });
  }

  handleClose () {
    fireEvent(this.pageRef, 'closeDocument', '*')
  }

  handleSingleSelectionChange(event) {
    this.checkForErrors();

    if (event.detail.length < 1) {
      this.handleClose()
      return;
    }

    const selection = this.template.querySelector('c-lookup').getSelection()

    this.isLoading = true;
    this.documentTemplate = selection[0]


    getFileDataFromId({ Id: event.detail[0] })
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
  }

  handleUploadFinished(event) {
    this.showNotification('Done!...', `Successfully uploaded your file(s)`, 'success');
  }

  get acceptedFormats() {
    return [
      '.pdf',
      '.xfdf',
      '.fdf',
      //'doc',
      '.docx',
      '.xlsx',
      //'ppt',
      '.pptx',
      '.jpg',
      '.jpeg',
      '.png',
      '.mov',
      '.tif',
      //'.xls',
      '.xlsx'];
  }

  showNotification(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
    });
    this.dispatchEvent(evt);
  }

  //check for errors on selection
  checkForErrors() {
    this.errors = [];
    const selection = this.template.querySelector('c-lookup').getSelection();
    // Custom validation rule
    if (this.isMultiEntry && selection.length > this.maxSelectionSize) {
      this.errors.push({ message: `You may only select up to ${this.maxSelectionSize} items.` });
    }
    // Enforcing required field
    if (selection.length === 0) {
      this.errors.push({ message: 'Please make a selection.' });
    }
  }

  // The method onsort event handler
  updateColumnSorting(event) {

    var fieldName = event.detail.fieldName;
    var sortDirection = event.detail.sortDirection;
    // assign the latest attribute with the sorted column fieldName and sorted direction
    this.sortedBy = fieldName;
    this.sortedDirection = sortDirection;
    this.contentVersions = this.sortData(fieldName, sortDirection);
  }
}