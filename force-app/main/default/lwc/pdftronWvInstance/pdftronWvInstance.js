import { LightningElement, wire, track, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import libUrl from "@salesforce/resourceUrl/lib_8_4";
import myfilesUrl from '@salesforce/resourceUrl/myfiles';
import { publish, createMessageContext, releaseMessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import WebViewerMC from "@salesforce/messageChannel/WebViewerMessageChannel__c";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import mimeTypes from './mimeTypes'
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import saveDocument from '@salesforce/apex/PDFTron_ContentVersionController.saveDocument';
import getFileDataFromIds from '@salesforce/apex/PDFTron_ContentVersionController.getFileDataFromIds';

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export default class PdftronWvInstance extends LightningElement {
  config = '/config_apex.js';
  error;

  @track receivedMessage = '';
  channel;
  context = createMessageContext();

  source = 'My file';
  fullAPI = true;
  enableRedaction = true;
  @api recordId;

  @wire(CurrentPageReference)
  pageRef;

  connectedCallback() {
    this.handleSubscribe();
    
    registerListener('handleLink', this.handleLink, this);
    registerListener('blobSelected', this.handleBlobSelected, this);
    registerListener('fileIdsSelected', this.handleFileIdsSelected, this);
    registerListener('search', this.search, this);
    registerListener('video', this.loadVideo, this);
    registerListener('replace', this.contentReplace, this);
    registerListener('redact', this.contentRedact, this);
    registerListener('doc_gen_mapping', this.handleTemplateMapping, this);
    registerListener('bulk_mapping', this.handleBulkFill, this);
    registerListener('closeDocument', this.closeDocument, this);
    window.addEventListener('message', this.handleReceiveMessage.bind(this), false);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
    window.removeEventListener('message', this.handleReceiveMessage, true);
    this.handleUnsubscribe();
  }

  handleBulkFill(results){
    console.log(results);
    this.iframeWindow.postMessage({ type: 'BULK_TEMPLATE', results }, '*');
  }

  handleLink(event) {
    let url = event.data.payload;
    this.iframeWindow.postMessage({ type: 'LOAD_URL', url }, '*');
  }

  handleSubscribe() {
    if (this.channel) {
      return;
    }
    this.channel = subscribe(this.context, WebViewerMC, (message) => {
      if (message) {
        console.log(message);
      }
    });
  }

  handleUnsubscribe() {
    releaseMessageContext(this.context);
    unsubscribe(this.channel);
  }
  
  handleTemplateMapping(mapping) {
    console.log('mapping in instance: ', mapping);
    this.iframeWindow.postMessage({ type: 'FILL_TEMPLATE', mapping }, '*');
  }

  contentReplace(payload) {
    this.iframeWindow.postMessage({ type: 'REPLACE_CONTENT', payload }, '*');
  }

  contentRedact() {
    this.iframeWindow.postMessage({ type: 'REDACT_CONTENT' }, '*');
  }

  loadVideo(url) {
    this.iframeWindow.postMessage({ type: 'LOAD_VIDEO', url }, '*');
  }

  search(term) {
    this.iframeWindow.postMessage({ type: 'SEARCH_DOCUMENT', term }, '*');
  }

  handleFileIdsSelected(records) {
    records = JSON.parse(records);
    console.log(records);
    getFileDataFromIds({ Ids: records })
      .then((result) => {
        if(result.length === 1) {
          this.handleBlobSelected(result[0]);
        } else if (result.length > 1) {
          console.log(result);
          this.handleFilesSelected(result);
        }
      })
      .catch((error) => {
        console.error(error);
        this.error = error;
        
        //this.showNotification('Error', error.body.message, 'error');
      });

    //this.iframeWindow.postMessage({ type: 'OPEN_DOCUMENT_LIST', temprecords }, '*');
  }

  handleFilesSelected(records) {
    //records = JSON.parse(records);

    console.log("records", records);
    let temprecords = [];

    records.forEach(record => {
      let blobby = new Blob([_base64ToArrayBuffer(record.body)], {
        type: mimeTypes[record.FileExtension]
      });

      let payload = {
        blob: blobby,
        extension: record.cv.FileExtension,
        filename: record.cv.Title + "." + record.cv.FileExtension,
        documentId: record.cv.Id
      };

      temprecords = [...temprecords, payload];
    });

    console.log("temprecords", temprecords);
    this.iframeWindow.postMessage({ type: 'OPEN_DOCUMENT_LIST', temprecords }, '*');
  }

  handleBlobSelected(record) {
    let blobby = new Blob([_base64ToArrayBuffer(record.body)], {
      type: mimeTypes[record.FileExtension]
    });

    console.log("blobby", blobby);

    const payload = {
      blob: blobby,
      extension: record.cv.FileExtension,
      filename: record.cv.Title + "." + record.cv.FileExtension,
      documentId: record.cv.Id
    };

    console.log("payload", payload);
    this.iframeWindow.postMessage({ type: 'OPEN_DOCUMENT_BLOB', payload }, '*');
  }

  showNotification(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
    });
    this.dispatchEvent(evt);
  }

  renderedCallback() {
    var self = this;
    if (this.uiInitialized) {
      return;
    }
    this.uiInitialized = true;

    Promise.all([
      loadScript(self, libUrl + '/webviewer.min.js')
    ])
      .then(() => this.initUI())
      .catch(console.error);
  }

  initUI() {
    var myObj = {
      libUrl: libUrl,
      myfilesUrl: myfilesUrl,
      fullAPI: this.fullAPI || false,
      namespacePrefix: '',
    };
    var url = myfilesUrl + '/WVSF-Account-info-sample.pdf';

    const viewerElement = this.template.querySelector('div')
    // eslint-disable-next-line no-unused-vars
    const viewer = new WebViewer({
      path: libUrl, // path to the PDFTron 'lib' folder on your server
      custom: JSON.stringify(myObj),
      backendType: 'ems',
      //initialDoc: url,
      config: myfilesUrl + this.config,
      fullAPI: this.fullAPI,
      enableFilePicker: this.enableFilePicker,
      enableRedaction: this.enableRedaction,
      enableMeasurement: this.enableMeasurement,
      // l: 'YOUR_LICENSE_KEY_HERE',
    }, viewerElement);

    viewerElement.addEventListener('ready', () => {
      this.iframeWindow = viewerElement.querySelector('iframe').contentWindow;
    })

  }

  handleReceiveMessage(event) {
    const me = this;
    if (event.isTrusted && typeof event.data === 'object') {
      switch (event.data.type) {
        case 'DOC_KEYS':
          let keys = event.data.keys;
          console.log("keys", keys);

          console.log("firing doc_gen_options");
          fireEvent(this.pageRef, 'doc_gen_options', keys);
          break;
        case 'SAVE_DOCUMENT':
          const cvId = event.data.payload.contentDocumentId;
          saveDocument({ json: JSON.stringify(event.data.payload), recordId: event.data.payload.recordId, cvId: cvId })
          .then((response) => {
            me.iframeWindow.postMessage({ type: 'DOCUMENT_SAVED', response }, '*');
            
            fireEvent(this.pageRef, 'refreshOnSave', response);

            this.showNotification('Success', event.data.payload.filename + ' Saved', 'success');
          })
          .catch(error => {
            me.iframeWindow.postMessage({ type: 'DOCUMENT_SAVED', error }, '*')
            fireEvent(this.pageRef, 'refreshOnSave', error);
            console.error(event.data.payload.contentDocumentId);
            console.error(JSON.stringify(error));
            this.showNotification('Error', error.body, 'error');
          });
          break;
        default:
          break;
      }
    }
  }

  @api
  closeDocument() {
    this.iframeWindow.postMessage({type: 'CLOSE_DOCUMENT' }, '*')
  }
}