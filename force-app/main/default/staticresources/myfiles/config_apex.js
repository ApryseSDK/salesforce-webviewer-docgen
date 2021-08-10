window.CoreControls.forceBackendType('ems');
window.CoreControls.setPDFWorkerPath('/resource/pdf_full');
window.CoreControls.setPDFResourcePath('/resource');
window.CoreControls.setPDFAsmPath('/resource/asm_full');
window.CoreControls.setExternalPath('/resource/external');

window.sampleL = 'Fatco Holdings LLC(firstam.com):ENTERP:EWB3::B+:AMS(20201215):3FF555A16A16230B9ABBC8B253086F01004F2DC3CD130EFF3B9A2C2CB9F654A2B6F5C7'; // enter your key here so that the samples will run

if (!window.sampleL) {
    window.sampleL = localStorage.getItem('wv-sample-license-key') || window.location.search.slice(5);
    if (!window.sampleL) {
        window.sampleL = window.prompt('No license key is specified.\nPlease enter your key here or add it to license-key.js inside the samples folder.', '');
        if (window.sampleL) {
            localStorage.setItem('wv-sample-license-key', window.sampleL);
        }
    }
}

var isDocLoaded = false;

window.addEventListener('viewerLoaded', function() {
    const docViewer = instance.Core.documentViewer;
    var annotManager = docViewer.getAnnotationManager();
    

    var ImageSelectTool = function(docViewer) {
        Tools.RectangleCreateTool.apply(this, arguments);
    };
    ImageSelectTool.prototype = new Tools.RectangleCreateTool();

    let getPageCanvas = function(pageIndex) {
        return document.querySelector('#pageContainer' + pageIndex + ' .canvas' + pageIndex);
    };

    // Sets the thickness of freehand tools to 5pts
    docViewer.getTool('AnnotationCreateFreeHand').setStyles(currentStyle => ({
        StrokeThickness: 5
    }));

    // Sets the Rectangle shape tool have a red color and a thickness of 5pts
    docViewer.getTool('AnnotationCreateRectangle').setStyles(currentStyle => ({
        StrokeThickness: 5,
        StrokeColor: new Annotations.Color(255, 0, 0)
    }));
    
    // Sets the Ellipse shape tool have a red color and a thickness of 5pts
    docViewer.getTool('AnnotationCreateEllipse').setStyles(currentStyle => ({
        StrokeThickness: 5,
        StrokeColor: new Annotations.Color(255, 0, 0)
    }));

    // Sets the Arrow shape tool have a red color and a thickness of 5pts
    docViewer.getTool('AnnotationCreateArrow').setStyles(currentStyle => ({
        StrokeThickness: 5,
        StrokeColor: new Annotations.Color(255, 0, 0)
    }));

    // Sets the Line tool have a red color and a thickness of 5pts
    docViewer.getTool('AnnotationCreateLine').setStyles(currentStyle => ({
        StrokeThickness: 5,
        StrokeColor: new Annotations.Color(255, 0, 0)
    }));

    var imageSelectToolName = 'ImageSelect';
    var imageSelectTool = new ImageSelectTool(docViewer);

    instance.registerTool({
        toolName: imageSelectToolName,
        toolObject: imageSelectTool,
        buttonImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="steps"><path d="M20.5 23.2h-3.2V21h3.2v2.2zm0-1.1zM14 23.2h-3.2V21H14v2.2zm-6.5 0H4.3V21h3.2v2.2zm-4.3-2.8H1v-3.2h2.2v3.2zm19.8-.7h-2.2v-3.3H23v3.3zM3.2 14H1v-3.2h2.2V14zm19.8-.8h-2.2V10H23v3.2zM3.2 7.5H1V4.3h2.2v3.2zM23 6.8h-2.2V3.6H23v3.2zM19.7 3h-3.3V.8h3.3V3zm-6.5 0H10V.8h3.2V3zM6.8 3H3.6V.8h3.2V3z"></path></svg>',
        buttonName: 'imageSelectToolButton',
        tooltip: 'Image to text selection'
    });

    instance.setHeaderItems(function(header) {

        // Removing mobile css classes from the select tool arrow icon.
        const items = header.getItems();
        items.splice(5, 1, {
            hidden: [],
            toolName: "AnnotationEdit",
            type: "toolButton"
        });

        header.update(items);

        // Google Vision / OCR select tool
        const imageSelectButton = {
            type: 'toolButton',
            toolName: imageSelectToolName,
            dataElement: 'imageSelectToolButton'
        };
        header.get('freeHandToolGroupButton').insertBefore(imageSelectButton);

        // Custom Save document button
        const saveDocumentButton = {
            type: 'actionButton',
            toolName: 'saveDocumentToolButton',
            dataElement: 'saveDocument',
            title: 'Save',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="save"><path d="M17.1 1.8v6.3c0 .5-.3.9-.9.9H6.4c-.4 0-.9-.4-.9-.9V1.8H3.7c-1 0-1.9.9-1.9 1.9v16.6c0 1 .9 1.9 1.9 1.9h16.6c1 0 1.9-.9 1.9-1.9V5.2l-3.4-3.4h-1.7zm3.3 17.6c0 .5-.4.9-.9.9H4.6c-.5 0-.9-.4-.9-.9v-7.7c0-.4.4-.9.9-.9h14.9c.4 0 .9.4.9.9v7.7zm-9-13.1c0 .4.4.9.9.9h2.1c.5 0 .9-.4.9-.9V1.8h-3.8l-.1 4.5z"></path></svg>',
            onClick: function(event) {
                callSaveFile(event,false);
            }
        }
        header.get('searchButton').insertAfter(saveDocumentButton);

        // Custom Sidebar tools toggle
        const toggleSidebarButton = {
            type: 'actionButton',
            toolName: 'toggleSidebarToolButton',
            dataElement: 'toggleSidebar',
            title: 'Toggle Sidebar',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="toggle_panel_right"><title></title><path d="M1.8 3.7h20.4v16.6H1.8V3.7zm1.9 1.8v13h16.6v-13H3.7zm10.1 1h5.6v11h-5.6v-11z"></path></svg>',
            onClick: function(event) {
               parent.postMessage({
                type: 'RENDER_SIDEBAR'
               })
            }
        }
        header.get('menuButton').insertAfter(toggleSidebarButton);

        const toggleFullscreenButton = {
            type: 'actionButton',
            dataElement: 'toggleFullscreenButton',
            title: 'Toggle Fullscreen',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="expand_alt"><path d="M22.5.9h-7.1c-.5 0-.6.4-.3.8L17.4 4l-4.2 4.1c-.2.3-.2.6 0 .9l1.8 1.7c.2.2.6.2.8 0L20 6.5l2.3 2.3c.4.3.8.2.8-.3V1.4c0-.2-.3-.5-.6-.5zM1.6 23.1h7.1c.5 0 .6-.5.3-.9l-2.3-2.3 4.1-4.2c.3-.2.3-.7 0-.9l-1.7-1.7c-.2-.2-.6-.2-.8 0l-4.2 4.2L1.8 15c-.4-.4-.9-.2-.9.2v7.1c0 .4.4.8.7.8z"></path></svg>',
            onClick: function() {
                instance.toggleFullScreen();
            }
        }
        header.get('saveDocument').insertAfter(toggleFullscreenButton);

        const printButton = {
            type: 'actionButton',
            dataElement: 'printButton',
            title: 'Print',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="print"><path d="M21.5 8h-19c-1 0-1.8.9-1.8 1.9v6.4c0 1.1.8 1.9 1.8 1.9h2.8v2.7c0 1 .8 1.8 1.8 1.8h9.8c1.1 0 1.9-.8 1.9-1.8v-2.7h2.7c1 0 1.9-.8 1.9-1.9V9.9c-.1-1-.9-1.9-1.9-1.9zM3.8 12.8c-.8 0-1.4-.6-1.4-1.4S3 10 3.8 10s1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm12.8 7.1c0 .4-.4.7-.7.7H8c-.3 0-.7-.3-.7-.7v-4.5c0-.4.4-.7.7-.7h7.9c.3 0 .7.3.7.7v4.5zm2.1-14.8c0 .4-.3.7-.7.7H5.9c-.4 0-.7-.3-.7-.7V2c0-.4.3-.7.7-.7H18c.4 0 .7.3.7.7v3.1z"></path></svg>',
            onClick: function() {
                instance.print();
            }
        }
        header.get('toggleFullscreenButton').insertAfter(printButton);
    });

    docViewer.addEventListener("pageComplete", function(event) {
        isDocLoaded = false;
    });

    docViewer.addEventListener("documentLoaded", function(event) {
        isDocLoaded = true;

        imageSelectTool.addEventListener('annotationAdded', function(annotation) {
            var pageIndex = annotation.getPageNumber() - 1;
            // get the canvas for the page
            var pageCanvas = getPageCanvas(pageIndex);
            var topOffset = parseFloat(pageCanvas.style.top) || 0;
            var leftOffset = parseFloat(pageCanvas.style.left) || 0;
            var zoom = docViewer.getZoom() * window.utils.getCanvasMultiplier();

            var x = annotation.X * zoom - leftOffset;
            var y = annotation.Y * zoom - topOffset;
            var width = annotation.Width * zoom;
            var height = annotation.Height * zoom;

            var copyCanvas = document.createElement('canvas');
            copyCanvas.width = width;
            copyCanvas.height = height;
            let ctx = copyCanvas.getContext('2d');
            // copy the image data from the page to a new canvas so we can get the data URL
            ctx.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height);

            // create a new stamp annotation that will have the image data that was under the rectangle
            let stampAnnot = new Annotations.StampAnnotation();
            stampAnnot.PageNumber = annotation.PageNumber;
            stampAnnot.X = annotation.X;
            stampAnnot.Y = annotation.Y;
            stampAnnot.Width = annotation.Width;
            stampAnnot.Height = annotation.Height;
            stampAnnot.Author = annotManager.getCurrentUser();
            stampAnnot.ImageData = copyCanvas.toDataURL();

            // Triggers text extraction with Google Vision in x7sFilePickerCombobox component.
            parent.postMessage({
                imageData: copyCanvas.toDataURL("image/png"),
                type: 'IMG_TRANSLATE'
            });

            /*
             * After a timeout, remove the rectangular select lines from the viewer.
             */
            setTimeout(() => {
                annotManager.deleteAnnotation(annotation);
            }, 1000);

            // I'm not sure if the follow is needed anymore, but I left it in there just to be safe
            //annotManager.addAnnotation(stampAnnot);
            //annotManager.selectAnnotation(stampAnnot);
        });
    });
});

async function convertFromTif(blob) {
    if (!blob) {
        return;
    }
    await PDFNet.initialize();
    let doc = null;
    await PDFNet.runWithoutCleanup(async () => {
        // create an empty document
        doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();
        doc.lock();
        let bufferTiff = await blob.arrayBuffer();
        const tiffFile = await PDFNet.Filter.createFromMemory(bufferTiff);
        await PDFNet.Convert.fromTiff(doc, tiffFile);
        const buffer = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
        doc.unlock();
    });
    return doc;
}
  
async function mergeFilesFromArray(array) {
    const temprecords = array;
    console.log('Printing temprecords : ' + JSON.stringify(temprecords));
    let tifFlag = false; //tif support
    let currentIndex = 0;
    let initialDoc = null;
    //load first doc
    if (temprecords[currentIndex].extension === 'tif') {
        tifFlag = true;
        tiffBuffer = await convertFromTif(temprecords[currentIndex].blob); //convert tif to pdf
        initialDoc = await window.CoreControls.createDocument(
            tiffBuffer,
            {
                extension: 'pdf',
                docId: temprecords[currentIndex].documentId,
                filename: temprecords[currentIndex].filename
            }
        );
    } else {
        //console.log('not a tiff');
        initialDoc = await window.CoreControls.createDocument(
            temprecords[currentIndex].blob,
            {
                extension: temprecords[currentIndex].extension,
                docId: temprecords[currentIndex].documentId,
                filename: temprecords[currentIndex].filename
            }
        );
    }
    //console.log('initialDoc : ' + JSON.stringify(initialDoc));
    //append other docs if present in array
    console.log('temprecords.length : ' + temprecords.length);
    if (temprecords.length > 1) {
        currentIndex = 1;
        let docToBeAdded = null;
        //iterate through remaining docs in array, and add them to first doc
        while (initialDoc && currentIndex < temprecords.length) {
            docToBeAdded = null;
            if (temprecords[currentIndex].extension === 'tif') {
                console.log('docToBeAdded TIFF');
                tifFlag = true;
                tiffBuffer = await convertFromTif(temprecords[currentIndex].blob);
                docToBeAdded = await window.CoreControls.createDocument(
                    tiffBuffer,
                    {
                        extension: 'pdf',
                        docId: temprecords[currentIndex].documentId,
                        filename: temprecords[currentIndex].filename
                    }
                );
                await initialDoc.insertPages(docToBeAdded);
                currentIndex++;
            } else {
                console.log('docToBeAdded PDF else');
                console.log('temprecords.length : ' + temprecords.length);
                console.log('initialdoc 277: ' + initialDoc);
                docToBeAdded = await window.CoreControls.createDocument(
                    temprecords[currentIndex].blob,
                    {
                        extension: temprecords[currentIndex].extension,
                        docId: temprecords[currentIndex].documentId,
                        filename: temprecords[currentIndex].filename
                    }
                );
                await initialDoc.insertPages(docToBeAdded);
                console.log('initialdoc 287: ' + initialDoc);
                currentIndex++;
            }
        }
    }
    if (tifFlag) {
        instance.loadDocument(initialDoc); //already in PDF format
    } else {
        //create blob from document
        const data = await initialDoc.getFileData();
        console.log('Loading Document in viewer : ' + JSON.stringify(data));
        const arr = new Uint8Array(data);
        const blob = new Blob([arr], { type: 'application/pdf' });
        //download file here or do other stuff with blob like sending it out / saving back to database
        //downloadFile(blob, "myfile.pdf"); 
        //load document(s) in webviewer
        instance.loadDocument(blob);
    }
}

async function createBlobFromURL(url) {
    let blob = await fetch(url).then(r => r.blob());
    return blob;
}

async function mergeDocuments(arraydata) {
    const temprecords = arraydata; //array of documents

    let tifFlag = false;

    let currentIndex = 0;
    let initialDoc = null;

    //load first doc
    if (temprecords[currentIndex].extension === 'tif') {
        tifFlag = true;
        if(!temprecords[currentIndex].blob && temprecords[currentIndex].URL) {
            //build blob from URL
            temprecords[currentIndex].blob = await createBlobFromURL(temprecords[currentIndex].URL);
        }
        tiffBuffer = await convertFromTif(temprecords[currentIndex].blob);
        initialDoc = await window.CoreControls.createDocument(
            tiffBuffer,
            {
                extension: 'pdf',
                docId: temprecords[currentIndex].documentId,
                filename: temprecords[currentIndex].filename
            }
        );
    } else {
        if(!temprecords[currentIndex].blob && temprecords[currentIndex].URL) {
            //build blob from URL
            temprecords[currentIndex].blob = await createBlobFromURL(temprecords[currentIndex].URL);
        }
        initialDoc = await window.CoreControls.createDocument(
            temprecords[currentIndex].blob,
            {
                extension: temprecords[currentIndex].extension,
                docId: temprecords[currentIndex].documentId,
                filename: temprecords[currentIndex].filename
            }
        );
    }

    //append other docs if present
    if (temprecords.length > 1) {
        currentIndex = 1;
        let docToBeAdded = null;

        //iterate through remaining docs in array, and add them to first doc
        while (initialDoc && currentIndex < temprecords.length) {
            docToBeAdded = null;

            if (temprecords[currentIndex].extension === 'tif') {
                tifFlag = true;
                if(!temprecords[currentIndex].blob && temprecords[currentIndex].URL) {
                    //build blob from URL
                    temprecords[currentIndex].blob = await createBlobFromURL(temprecords[currentIndex].URL);
                }
                tiffBuffer = await convertFromTif(temprecords[currentIndex].blob);
                docToBeAdded = await window.CoreControls.createDocument(
                    tiffBuffer,
                    {
                        extension: 'pdf',
                        docId: temprecords[currentIndex].documentId,
                        filename: temprecords[currentIndex].filename
                    }
                );
                await initialDoc.insertPages(docToBeAdded);
                currentIndex++;
            } else {
                if(!temprecords[currentIndex].blob && temprecords[currentIndex].URL) {
                    //build blob from URL
                    temprecords[currentIndex].blob = await createBlobFromURL(temprecords[currentIndex].URL);
                }
                docToBeAdded = await window.CoreControls.createDocument(
                    temprecords[currentIndex].blob,
                    {
                        extension: temprecords[currentIndex].extension,
                        docId: temprecords[currentIndex].documentId,
                        filename: temprecords[currentIndex].filename
                    }
                );

                //backwards compatibility to WebViewer 6.0.3
                let pagesArray = [];
                for(let i = 1; i <= docToBeAdded.getPageCount(); i++) {
                    pagesArray.push(i);
                }

                await initialDoc.insertPages(docToBeAdded, pagesArray);
                currentIndex++;
            }
        }
    }

    if (tifFlag) {
        event.target.instance.loadDocument(initialDoc);
    } else {
        const data = await initialDoc.getFileData();
        const arr = new Uint8Array(data);
        const blob = new Blob([arr], { type: 'application/pdf' });

        //download file here or do other stuff with blob like sending it out / saving back to database
        //downloadFile(blob, "myfile.pdf"); 

        //load document(s) in webviewer
        event.target.instance.loadDocument(blob);
    }
}

function downloadFile(blob, fileName) {
    const link = document.createElement('a');
    // create a blobURI pointing to our Blob
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    // some browser needs the anchor to be in the doc
    document.body.append(link);
    link.click();
    link.remove();
    // in case the Blob uses a lot of memory
    setTimeout(() => URL.revokeObjectURL(link.href), 7000);
}

async function callSaveFile(event,newFile) {
    const docViewer = instance.Core.documentViewer;
    let doc = docViewer.getDocument();
    var annotManager = docViewer.getAnnotationManager();
    let xfdfString = await annotManager.exportAnnotations();

    doc.getFileData({
        // saves the document with annotations in it
        xfdfString: xfdfString
    }).then(function(data) {
        if(newFile){
        parent.postMessage({
            imageData: data,
            type: 'SAVE_NEW_IMAGE',
            extension: 'pdf'
        });
    }else{
        parent.postMessage({
            imageData: data,
            type: 'SAVE_IMAGE',
            extension: 'pdf'
        });
    }
    }).catch((err) => {
        //VIT___ console.error('callSaveFile error', err);
    })
}

async function callSaveNewFile(event) {
    const docViewer = instance.Core.documentViewer;
    let doc = docViewer.getDocument();
    var annotManager = docViewer.getAnnotationManager();
    let xfdfString = await annotManager.exportAnnotations();

    doc.getFileData({
        // saves the document with annotations in it
        xfdfString: xfdfString
    }).then(function(data) {
        parent.postMessage({
            imageData: data,
            type: 'SAVE_NEW_IMAGE',
            extension: 'pdf'
        });
    }).catch((err) => {
        //VIT__ console.error('callSaveFile error', err);
    })
}

// Saves non-PDF file. Used for saving TIF files.
async function callSaveNewFileNonPDF(event) {
    const ext = event.data.file.name.split('.').slice(-1)[0];
    parent.postMessage({
        imageData: event.data.file,
        type: 'SAVE_NEW_IMAGE',
        extension: ext
    });
}

async function loadSaveFile(event) {
    const PDFNet = window.PDFNet;
    const isTif = event.data.fileExtension.toLowerCase().includes('tif');

    // For tif and tiff files we are loading them differently
    if(isTif){
        await PDFNet.initialize();
        const doc = await PDFNet.PDFDoc.create();
        let newBlob = new Blob([event.data.imageData], { type:  'image/tiff' });
        doc.initSecurityHandler();
        doc.lock();
        console.log('file here', event.data.imageData);
       // const targetFile  = event.data.imageData;
        const objectURL = window.URL.createObjectURL(newBlob);
        // let objectURL = URL.createObjectURL(event.data.imageData); // Creating a URL for the file blob
        const tiffFile = await PDFNet.Filter.createURLFilter(objectURL);
        await PDFNet.Convert.fromTiff(doc, tiffFile); // Puts the content from the tiff file to the newly created doc
        const buffer = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
        instance.loadDocument(buffer);
    }
    else {
        instance.loadDocument(event.data.imageData, { filename: event.data.fileName });
    }
}

// Utility async function to check for a condition value.
function waitFor(conditionFunction) {
    const poll = resolve => {
    if (conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 100);
    }
    
    return new Promise(poll);
}

window.addEventListener("message", receiveMessage, false);

function blobToFile(theBlob, fileName){       
    return new File([theBlob], fileName, { lastModified: new Date().getTime(), type: theBlob.type })
}

function mergeDocumentsToDoc(fileArray, nextCount, doc) {
    return new Promise(async function(resolve, reject) {
      const newDoc = await CoreControls.createDocument(fileArray[nextCount], { extension: 'pdf'});
      const newDocPageCount = newDoc.getPageCount();
  
      // create an array containing 1…N
      const pages = Array.from({ length: newDocPageCount }, (v, k) => k + 1);
      const pageIndexToInsert = doc.getPageCount() + 1;
  
      doc.insertPages(newDoc)
        .then(result => resolve({
          next: fileArray.length - 1 > nextCount,
          doc: doc,
        })
      );
    }).then(res => {
      return res.next ?
        mergeDocumentsToDoc(fileArray, nextCount + 1, res.doc) :
        res.doc;
    });
  }
 
function getFilesFromDocuments(documents, sessionId, count, i = 0, files = []) {  
    return new Promise(async function(resolve, reject) {
        let doc = documents[i];
        const subdomains = window.location.host.split('.');
        let baseUrl = subdomains[0];
        
        let formatUrl = 'https://${0}.my.salesforce.com/services/data/v47.0/sobjects/ContentVersion/${1}/VersionData';
        let urlString = formatUrl.replace("${0}", baseUrl);
        urlString = urlString.replace("${1}", doc.cVerId);            

        let request = new XMLHttpRequest();
        request.open("GET", urlString, true);
        //request.open("POST", urlString, true);
        request.responseType="blob";

        request.setRequestHeader('Authorization', "Bearer " + sessionId);
        request.setRequestHeader('Content-Type', 'application/json; charset=binary');

        request.onreadystatechange = async function() {
            // continue if the process is completed
            if (request.readyState === 4) {
                // continue only if HTTP status is good
                if (request.status >= 200 && request.status < 300) {
                    // retrieve the response
                    var isTif = doc.fileExtension.includes('tif');
                    let newBlob = new Blob([request.response], { type: isTif ? 'image/tiff' : 'application/pdf' });
                    let file = null;

                    if (isTif){
                        // if tif, convert to pdf.
                        await PDFNet.initialize();
                        const docPDF = await PDFNet.PDFDoc.create();
                        docPDF.initSecurityHandler();
                        docPDF.lock();
                        let objectURL = window.URL.createObjectURL(newBlob); // Creating a URL for the file blob
                        const tiffFile = await PDFNet.Filter.createURLFilter(objectURL);
                        await PDFNet.Convert.fromTiff(docPDF, tiffFile); // Puts the content from the tiff file to the newly created doc
                        const buffer = await docPDF.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
                        file = buffer; 
                    }else{
                        file = blobToFile(newBlob, doc.name);
                    }
                    
                    files.push(file);
                    resolve({
                        next: i+1 < count,
                        files: files
                    });
                } else {
                    // return status message
                    reject(request.statusText);
                }
            }
        };
        request.send();
    }).then(res => {
        return res.next ? this.getFilesFromDocuments(documents, sessionId, count, i+1, res.files) : res.files;
    });      
}

async function receiveMessage(event) {
    if (event.isTrusted && typeof event.data === 'object') {

        const e = event.target;
        const docViewer = instance.Core.documentViewer;
        const doc = docViewer.getDocument();
        const rotation = e.CoreControls.PageRotation;
        const PDFNet = window.PDFNet;

        switch (event.data.type) {
            case 'LOAD_SAVED_FILE':
                loadSaveFile(event);
                break;
            case 'SAVE_PDF':
                callSaveFile(event,false);
                break;
            case 'SAVE_NEW_DOCUMENT':
                const fileName = event.data.file.name;
                if(fileName.toLowerCase().includes('.tif')){
                    // converts tif file to PDF to view in the viewer.
                    await PDFNet.initialize();
                    const doc = await PDFNet.PDFDoc.create();
                    let newBlob = new Blob([event.data.file], {  type: 'image/tiff' });
                    doc.initSecurityHandler();
                    doc.lock();
                    const objectURL = window.URL.createObjectURL(newBlob);
                    // let objectURL = URL.createObjectURL(event.data.file); // Creating a URL for the file blob
                    const tiffFile = await PDFNet.Filter.createURLFilter(objectURL);
                    await PDFNet.Convert.fromTiff(doc, tiffFile); // Puts the content from the tiff file to the newly created doc
                    const buffer = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
                    e.instance.loadDocument(buffer);
                    await waitFor(_ => isDocLoaded === true);

                        // save actual TIF file, not the tif converted to PDF.
                        callSaveNewFileNonPDF(event,true);
                }
                else{
                    // Load the document in the viewer.
                    e.instance.loadDocument(event.data.file);

                    // Pause here until the pdftron pageComplete event updates our isDocLoaded flag.
                    await waitFor(_ => isDocLoaded === true);
                    // Once the file is ready in the viewer, call the save function.
                    callSaveNewFile(event,true);
                }
                break;
            case 'CALL_API':
                callAPI(event);
                break;
            case 'OPEN_DOCUMENT':
                //old, working version (pdf only):
                e.instance.loadDocument(event.data.file);
                // update 21-11-19 TIFF files also gets loaded now

                // license key goes here
                /*
                await PDFNet.initialize();
                
                                const doc = await PDFNet.PDFDoc.create();
                                doc.initSecurityHandler();
                                doc.lock();
                                const builder = await PDFNet.ElementBuilder.create();
                                const writer = await PDFNet.ElementWriter.create();
                                
                                let img = await PDFNet.Image.createFromURL(doc, URL.createObjectURL(event.data.file));
                                const imgWidth = await img.getImageWidth();
                                const imgHeight = await img.getImageHeight();
                
                                const pageRect = await PDFNet.Rect.init(0, 0, imgWidth, imgHeight);
                                let page = await doc.pageCreate(pageRect);
                                
                                writer.beginOnPage(page, PDFNet.ElementWriter.WriteMode.e_overlay);
                console.log('img: ',img);
                        let matrix = await PDFNet.Matrix2D.create(imgWidth, 0, 0, imgHeight, 10, 50);
                        let element = await builder.createImageFromMatrix(img, matrix);
                        writer.writePlacedElement(element);
                        writer.end();
                        doc.pagePushBack(page);
                        writer.end();
                //        doc.pagePushBack(page); // add the page to the document
                //        const docbuf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
                // todo get instance from Window instead of event
                        e.instance.loadDocument(doc);
                 */


                break;

                case 'INSERT_DOCUMENT':
                    const file = event.data.file.doc;
                    const pageNum = event.data.file.pageNum;
                    const ext = file.name.split('.').slice(-1)[0];
                    let fileToMerge = new Object();

                    if(ext.toLowerCase().includes('tif')){
                        // For tif files
                        await PDFNet.initialize();
                        const doc = await PDFNet.PDFDoc.create();
                        let newBlob = new Blob([event.data.file.doc], { type: 'image/tiff' });
                        doc.initSecurityHandler();
                        doc.lock();
                        const objectURL = window.URL.createObjectURL(newBlob);
                         //let objectURL = window.URL.createObjectURL(event.data.file.doc); // Creating a URL for the file blob
                        const tiffFile = await PDFNet.Filter.createURLFilter(objectURL);
                        await PDFNet.Convert.fromTiff(doc, tiffFile); // Puts the content from the tiff file to the newly created doc
                        const buffer = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
                        fileToMerge = buffer;
                    }
                    else {
                        fileToMerge = file;
                    }
    
                    // Updated code for inserting by Andrey
                    CoreControls.createDocument(fileToMerge, {}/* , license key here */)
                    .then(function(newDoc) {
                            var pages = [];
                            for (var i = 0; i < newDoc.getPageCount(); i++) {
                                pages.push(i + 1);
                            }
                            
                            // Insert (merge) pages
                            doc.insertPages(newDoc);
                        })
    
                    break;
            case 'ROTATE_PAGES':
                const rotatePages = event.data.obj.rotatePages;
                let rotateArr = [];

                // Handle string like 3,4,5
                if (rotatePages.indexOf(',') !== -1) {
                    rotateArr = rotatePages.split(',').map(Number);
                // Handle string like 3-5
                } else if (rotatePages.indexOf('-') !== -1) {
                    const pagesArr = rotatePages.split('-');
                    const firstPageNumber = parseInt(pagesArr[0], 10)
                    const lastPageNumber = parseInt(pagesArr[pagesArr.length - 1], 10)
                    for (let i = firstPageNumber; i <= lastPageNumber; i++) {
                        rotateArr.push(i);
                    }
                // Handle a single value like 3
                } else {
                    rotateArr.push(parseInt(rotatePages, 10));
                }

                // Validated that the array contains all numbers.
                if (rotateArr.every((value) => !isNaN(value) ) && rotateArr.length > 0) {
                    // Validated rotate array; Rotate pages.
                    switch (event.data.obj.degree) {
                        case 'e_90':
                            doc.rotatePages(rotateArr, rotation.e_90).catch((error) => {
                                parent.postMessage({
                                    type: 'ERROR_MESSAGE',
                                    value: `There was an error rotating the provided page numbers; ${error}`
                                });
                            });
                            break;
                        case 'e_180':
                            doc.rotatePages(rotateArr, rotation.e_180).catch((error) => {
                                parent.postMessage({
                                    type: 'ERROR_MESSAGE',
                                    value: `There was an error rotating the provided page numbers; ${error}`
                                });
                            });
                            break;
                        case 'e_270':
                            doc.rotatePages(rotateArr, rotation.e_270).catch((error) => {
                                parent.postMessage({
                                    type: 'ERROR_MESSAGE',
                                    value: `There was an error rotating the provided page numbers; ${error}`
                                });
                            });
                            break;
                        default:
                            break;
                    }

                } else {
                    // Invalid rotate array; Display error.
                    parent.postMessage({
                        type: 'ERROR_MESSAGE',
                        value: 'Please check the page number format.'
                    });
                }

                break;

            case 'DELETE_PAGES':
                const pages = event.data.pages;
                let deleteArr = [];

                // Handle string like 3,4,5
                if (pages.indexOf(',') !== -1) {
                    deleteArr = event.data.pages.split(',').map(Number);
                // Handle string like 3-5
                } else if (pages.indexOf('-') !== -1) {
                    const pagesArr = pages.split('-');
                    const firstPageNumber = parseInt(pagesArr[0], 10)
                    const lastPageNumber = parseInt(pagesArr[pagesArr.length - 1], 10)
                    for (let i = firstPageNumber; i <= lastPageNumber; i++) {
                        deleteArr.push(i);
                    }
                // Handle a single value like 3
                } else {
                    deleteArr.push(parseInt(pages, 10));
                }

                // Validated that the array contains all numbers.
                if (deleteArr.every((value) => !isNaN(value) ) && deleteArr.length > 0) {
                    // Validated delete array; Remove pages.
                    doc.removePages(deleteArr).catch((error) => {
                        parent.postMessage({
                            type: 'ERROR_MESSAGE',
                            value: `There was an error deleting the page numbers; ${error}`
                        });
                    });
                } else {
                    // Invalid delete array; Display error.
                    parent.postMessage({
                        type: 'ERROR_MESSAGE',
                        value: 'Please check the page number format.'
                    });
                }

                break;

            case 'MOVE_PAGES':
                doc.movePages([event.data.pages.pageFrom], event.data.pages.pageTo).then(() => {
                });
                break;

            case 'INSERT_PAGE':
                doc.insertBlankPages([event.data.page]).then(() => {
                });
                break;
            
            case 'MERGE_DOCUMENTS':
                //console.log('event.data.documentValues : ' + JSON.stringify(event.data.documentValues));
                /* mergeFilesFromArray(event.data.documentValues); */
                /* mergeDocuments(event.data.documentValues); */
                  
                const documentValues = event.data.documentValues;  
                const documentCount = documentValues.length;
                this.getFilesFromDocuments(documentValues, event.data.sessionID, documentCount)
                .then(files => {
                    return mergeDocumentsToDoc(files, 0, doc);
                });
                
                parent.postMessage({ type: 'MERGE_COMPLETED' }, '*'); 

                break;
            default:
                break;
        }
    }
}
