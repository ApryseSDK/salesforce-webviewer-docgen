import { LightningElement, track, api, wire } from 'lwc'
import { CurrentPageReference } from 'lightning/navigation'
import getSObjects from '@salesforce/apex/PDFTron_ContentVersionController.getSObjects'
import getObjectFields from '@salesforce/apex/PDFTron_ContentVersionController.getObjectFields'
import queryValuesFromRecord from '@salesforce/apex/PDFTron_ContentVersionController.queryValuesFromRecord'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub'

export default class PdftronTemplateMapper extends LightningElement {
  columns
  showTable = false
  isLoading = false
  @track recordId
  @track value
  @track rows = []
  @track values = []
  @track sObjects = []
  @track selectedObject = ''
  @track sObjectFields = []
  mapping = {}

  @wire(CurrentPageReference)
  pageRef

  @wire(getSObjects)
  attachments ({ error, data }) {
    if (data) {
      data.forEach(object => {
        let option = {
          label: object,
          value: object
        }
        this.sObjects = [...this.sObjects, option]
      })
      error = undefined
    } else if (error) {
      console.error(error)
      this.error = error

      this.showNotification('Error', error.body.message, 'error')
    }
  }

  connectedCallback () {
    registerListener('doc_gen_options', this.handleOptions, this)
    this.columns = [
      {
        label: 'Template Key',
        apiName: 'templateKey',
        fieldType: 'text',
        objectName: 'Account'
      },
      {
        label: 'Value',
        apiName: 'Value',
        fieldType: 'text',
        objectName: 'Account'
      }
    ]
  }

  renderedCallback () {
    if (this.rows.length > 0) {
      this.showTable = true
    }
  }

  disconnectedCallback () {
    unregisterAllListeners(this)
  }

  createUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  handleSObjectChange (event) {
    this.selectedObject = event.detail.value
    console.log('this.selectedObject', this.selectedObject)

    getObjectFields({ objectName: this.selectedObject })
      .then(data => {
        this.sObjectFields = []
        data.forEach(field => {
          let option = {
            label: field,
            value: field
          }
          this.sObjectFields = [...this.sObjectFields, option]
        })
      })
      .catch(error => {
        alert(error.body)
        console.error(error)
      })
  }

  handleSaveTemplate() {

  }

  handleFill () {
    this.isLoading = true
    const selectedFields = this.template.querySelectorAll('.dropdownfields') //get all dropdown selections
    let comboboxfields = [] //list of fields to query from apex
    let apiNameToTemplateKeyMap = {} //maps salesforce object field api names to documents' template keys

    //fill above from user input to dropdowns
    selectedFields.forEach(field => {
      comboboxfields.push(field.value)
      apiNameToTemplateKeyMap[field.value] = field.dataset.templatekey
    })

    //send list of fields to Apex and query via dynamic SOQL
    queryValuesFromRecord({
      recordId: this.recordId,
      objectName: this.selectedObject,
      fields: comboboxfields
    })
      .then(data => {
        this.isLoading = false

        //returns map of Salesforce field API: value - need to convert it to templatekey: value
        var newHashmap = {}
        Object.keys(data[0]).forEach(key => {
          var value = data[0][key]
          key = apiNameToTemplateKeyMap[key]
            ? apiNameToTemplateKeyMap[key]
            : key
          newHashmap[key] = value
        })

        this.mapping = newHashmap

        fireEvent(this.pageRef, 'doc_gen_mapping', this.mapping)
      })
      .catch(error => {
        this.isLoading = false

        this.showNotification('Error', 'There was an error when trying to preview your template: \n' + error, 'error')
        console.error(error)
      })



  }

  handleRecordId (event) {
    this.recordId = event.target.value
  }

  handleOptions (keys) {
    this.rows = []
    for (const i in keys) {
      this.rows = [
        ...this.rows,
        {
          uuid: this.createUUID(),
          templateKey: keys[i],
          placeholder: `Replace {{${keys[i]}}}`
        }
      ]
    }
  }

  handleChange (event) {
    this.mapping[event.target.dataset.key] = event.target.value
  }

  showNotification (title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    })
    this.dispatchEvent(evt)
  }
}
