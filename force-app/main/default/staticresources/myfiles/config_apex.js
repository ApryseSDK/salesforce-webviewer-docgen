var resourceURL = '/resource/'
window.CoreControls.forceBackendType('ems');

var urlSearch = new URLSearchParams(location.hash)
var custom = JSON.parse(urlSearch.get('custom'));
resourceURL = resourceURL + custom.namespacePrefix;

/**
 * The following `window.CoreControls.set*` functions point WebViewer to the
 * optimized source code specific for the Salesforce platform, to ensure the
 * uploaded files stay under the 5mb limit
 */
// office workers
window.CoreControls.setOfficeWorkerPath(resourceURL + 'office')
window.CoreControls.setOfficeAsmPath(resourceURL + 'office_asm');
window.CoreControls.setOfficeResourcePath(resourceURL + 'office_resource');

// pdf workers
window.CoreControls.setPDFResourcePath(resourceURL + 'resource')
if (custom.fullAPI) {
  window.CoreControls.setPDFWorkerPath(resourceURL + 'pdf_full')
  window.CoreControls.setPDFAsmPath(resourceURL + 'asm_full');
} else {
  window.CoreControls.setPDFWorkerPath(resourceURL + 'pdf_lean')
  window.CoreControls.setPDFAsmPath(resourceURL + 'asm_lean');
}

// external 3rd party libraries
window.CoreControls.setExternalPath(resourceURL + 'external')
window.CoreControls.setCustomFontURL('https://pdftron.s3.amazonaws.com/custom/ID-zJWLuhTffd3c/vlocity/webfontsv20/');

async function fillDocument(event) {
  const autofillMap = event.data.mapping;

  console.log('autofillMap', autofillMap);

  //{"image_url":"/resource/pdftron_logo", "width":64, "height":64}

  for (const entry in autofillMap) {
    console.log("autofillMap[entry]", autofillMap[entry]);
    if (autofillMap[entry].includes('image_url')) {
      const parentUrl = window.location.origin;
      alert(parentUrl)
      const json = JSON.parse(autofillMap[entry]);
      const path = json['image_url'];
      console.log(parentUrl + json['image_url']);
      if (path.substr(0, 4) != 'http') {
        console.log(parentUrl + path);
        console.log(autofillMap[entry]);
        json['image_url'] = parentUrl + path;
        console.log(JSON.stringify(json));
        autofillMap[entry] = json['image_url'];
      }
    }
  }

  await documentViewer.getDocument().applyTemplateValues(autofillMap);

}

async function saveDocument() {
  const doc = docViewer.getDocument();
  if (!doc) {
    return;
  }
  instance.openElement('loadingModal');

  const fileType = doc.getType();
  const filename = doc.getFilename();
  const xfdfString = await docViewer.getAnnotationManager().exportAnnotations();
  const data = await doc.getFileData({
    // Saves the document with annotations in it
    xfdfString
  });

  let binary = '';
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64Data = window.btoa(binary);

  const payload = {
    title: filename.replace(/\.[^/.]+$/, ""),
    filename,
    base64Data,
    contentDocumentId: doc.__contentDocumentId
  }
  // Post message to LWC
  parent.postMessage({ type: 'SAVE_DOCUMENT', payload }, '*');
}

window.addEventListener('viewerLoaded', async function () {
  /**
   * On keydown of either the button combination Ctrl+S or Cmd+S, invoke the
   * saveDocument function
   */
  instance.hotkeys.on('ctrl+s, command+s', e => {
    e.preventDefault();
    saveDocument();
  });

  window.addEventListener('documentLoaded', async () => {
    const { documentViewer } = instance.Core;
    console.log('document loaded!');

    await documentViewer.getDocument().documentCompletePromise();
    documentViewer.updateView();

    const doc = documentViewer.getDocument();
    const keys = doc.getTemplateKeys();

    console.log("keys", keys);

    parent.postMessage({ type: 'DOC_KEYS', keys }, '*');
  })

  // Create a button, with a disk icon, to invoke the saveDocument function
  instance.setHeaderItems(function (header) {
    var myCustomButton = {
      type: 'actionButton',
      dataElement: 'saveDocumentButton',
      title: 'tool.SaveDocument',
      img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
      onClick: function () {
        saveDocument();
      }
    }
    header.get('viewControlsButton').insertBefore(myCustomButton);
  });
});

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
  if (event.isTrusted && typeof event.data === 'object') {
    switch (event.data.type) {
      case 'OPEN_DOCUMENT':
        instance.loadDocument(event.data.file)
        break;
      case 'OPEN_DOCUMENT_BLOB':
        const { blob, extension, filename, documentId } = event.data.payload;
        instance.loadDocument(blob, { extension, filename, documentId })
        break;
      case 'DOCUMENT_SAVED':
        instance.showErrorMessage('Document saved!')
        setTimeout(() => {
          instance.closeElements(['errorModal', 'loadingModal'])
        }, 2000)
        break;
      case 'LMS_RECEIVED':
        /*  
        readerControl.showErrorMessage('Link received: ' + event.data.message);
        setTimeout(() => {
          readerControl.closeElements(['errorModal', 'loadingModal'])
        }, 2000)
        */
       
        instance.loadDocument(event.data.message, {
          filename: 'MyFile.pdf',
          withCredentials: false
        });
        
        break;
      case 'FILL_TEMPLATE':
        fillDocument(event);
        break;
      case 'CLOSE_DOCUMENT':
        instance.closeDocument()
        break;
      default:
        break;
    }
  }
}
