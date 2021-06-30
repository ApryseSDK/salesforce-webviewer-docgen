public with sharing class PDFTron_ContentVersionController {
    @AuraEnabled (cacheable=true)
    public static List<ContentVersion> retrieveContentVersion() {
        return [SELECT Title, FileExtension
                FROM ContentVersion
                ORDER BY Title
                ];
    }

    @AuraEnabled(Cacheable=true)
    public static List<ContentVersionWrapper> getAttachments(String recordId){
        try {
            List<String> cdIdList = new List<String> ();
            List<ContentVersionWrapper> cvwList = new List<ContentVersionWrapper> ();

            //Find links between record & document
            for(ContentDocumentLink cdl : 
                    [   SELECT id, ContentDocumentId, ContentDocument.LatestPublishedVersionId 
                        FROM ContentDocumentLink 
                        WHERE LinkedEntityId = :recordId    ]) {
                cdIdList.add(cdl.ContentDocumentId);
            }
            //Use links to get attachments
            for(ContentVersion cv : 
                    [   SELECT Id, Title,FileExtension, VersionData 
                        FROM ContentVersion 
                        WHERE ContentDocumentId IN :cdIdList 
                        AND IsLatest = true ]) {
                if(checkFileExtension(cv.FileExtension)) {
                    System.debug('Converting CV: ' + cv.Id);
                    cvwList.add(new ContentVersionWrapper(cv));
                    System.debug('Completed CV Conversion:' + cv);
                }
            }
            system.debug(cvwList);
            return cvwList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void saveDocument(String json, String recordId) {
        try {
            System.debug(recordId);
            PDFTron_ContentVersionPayload pl = PDFTron_ContentVersionPayload.parse(json);
            ContentVersion cv = new ContentVersion();
            
            // 'S' = a Salesforce File
            cv.ContentLocation = 'S';
            if(pl.contentDocumentId != null) {
                cv.ContentDocumentId = pl.contentDocumentId;
                cv.ReasonForChange = 'Saved from WebViewer';//only for file updates
            } else if (recordId != null) {
                for(ContentDocumentLink cdl : 
                    [   SELECT ContentDocumentId, ContentDocument.Title
                        FROM ContentDocumentLink 
                        WHERE LinkedEntityId = :recordId
                        AND ContentDocument.Title = :pl.title ]) {
                            if(cdl.ContentDocumentId != null) {
                                cv.ContentDocumentId = cdl.ContentDocumentId;
                            }
                        }
            }
            cv.VersionData = EncodingUtil.base64Decode(pl.base64Data);
            cv.Title = pl.title;
            cv.PathOnClient = pl.filename;
            
            system.debug('### Upserting cv: ' + cv);
            upsert cv; 
        } catch (Exception e) {
            system.debug('### ERROR: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true)
    public static List<LookupSearchResult> search(String searchTerm, List<String> selectedIds) {
        searchTerm = '%' + searchTerm + '%'; 

        // Prepare results
        List<LookupSearchResult> results = new List<LookupSearchResult>();

        for (ContentVersion cv : [
            SELECT Title, FileExtension, LastModifiedDate, ContentSize, LastModifiedBy.Alias
            FROM ContentVersion
            WHERE Title LIKE :searchTerm
            ORDER BY LastModifiedDate DESC
        ]) {
            System.debug(cv);
            if(checkFileExtension(cv.FileExtension)) {
                String subtitle = 'Modified ' + cv.LastModifiedDate + ' by ' + cv.LastModifiedBy.Alias;
                results.add(new LookupSearchResult(cv.Id, 'ContentVersion', getFileLogo(cv.FileExtension), cv.Title + '.' + cv.FileExtension + ' (' + convertBytesToFormattedString(cv.ContentSize) + ')', subtitle));
            }
        }

        //results.sort();
        return results;
    }

    //get single file from Id
    @AuraEnabled(Cacheable=true) 
    public static ContentVersionWrapper getFileDataFromId(String Id) {
        try {
            Long max = 1024 * 1024 * 25; // kb - mb - 6 MB
            ContentVersion cv = [SELECT Title, FileExtension, ContentSize, VersionData, ContentDocumentId, LastModifiedDate FROM ContentVersion WHERE Id = :Id];
            if(cv.ContentSize > max) {
                throw new PDFTronException('Your file size must not exceed ' + convertBytesToFormattedString(max) + ' - current file size: ' + convertBytesToFormattedString(cv.ContentSize));
            }
            return new ContentVersionWrapper(cv);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    //get multiple files from Ids
    @AuraEnabled(Cacheable=true) 
    public static List<ContentVersionWrapper> getFileDataFromIds(List<String> Ids) {
        try {
            Long current = 0;
            Long max = 1024 * 1024 * 25; // kb - mb - 6 MB
            List<ContentVersionWrapper> cvwList = new List<ContentVersionWrapper>();
            for(ContentVersion cv : [SELECT Title, FileExtension, ContentSize, VersionData, ContentDocumentId, LastModifiedDate FROM ContentVersion WHERE Id IN :Ids]) {
                current += cv.ContentSize;
                System.debug(convertBytesToFormattedString(current));
                if(current > max) {
                    throw new PDFTronException('Your total file size must not exceed ' + convertBytesToFormattedString(max) + ' - current file size: ' + convertBytesToFormattedString(current));
                }
                cvwList.add(new ContentVersionWrapper(cv));
            }
            return cvwList;
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<String> getPickList(String objectName, String fieldName) {
        List<String> values = new List<String>();
        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objectName});
        
        for(Schema.DescribeSobjectResult res : results) {
            for (Schema.PicklistEntry entry : res.fields.getMap().get(fieldName).getDescribe().getPicklistValues()) {
                if (entry.isActive()) {
                    values.add(entry.getValue());
                }
            }
        }
        return values;
    }

    /** 
     * 
     * Util methods
     *  
     **/

     public static String getFileLogo(String extension) {
        String logo = 'doctype:unknown';

        if(extension == 'pdf') {
            logo = 'doctype:pdf';
        } else if(extension == 'docx' || extension == 'doc') {
            logo = 'doctype:word';
        } else if(extension == 'xlsx' || extension == 'xls') {
            logo = 'doctype:excel';
        } else if(extension == 'tif' || extension == 'jpg' || extension == 'jpeg' || extension == 'png') {
            logo = 'doctype:image';
        }             
        return logo;
     }

    //only process blobs from below file formats
    public static Boolean checkFileExtension(String extension) {
        return new Set<String> {
            'pdf', 
            'xfdf',
            'fdf',
            //'doc',
            'docx', 
            'xlsx',
            //'ppt',
            'pptx',
            'jpg',
            'jpeg',
            'png',
            'mov',
            'tif',
            //'xls',
            'xlsx'
        }.contains(extension.toLowerCase()); //compare set of valid extensions with lower case input string
    }

    //take long value and output readable string
    public static String convertBytesToFormattedString(Long Value) {
        if (Value < 1024) {
            //no conversion needed
            return string.valueOf(Value) + ' Bytes';
        } else if (Value >= 1024 && Value < (1024*1024)) {
            //KB
            Decimal kb = Decimal.valueOf(Value);
            kb = kb.divide(1024,2);
            return string.valueOf(kb) + ' KB';
        } else if (Value >= (1024*1024) && Value < (1024*1024*1024)) {
            //MB
            Decimal mb = Decimal.valueOf(Value);
            mb = mb.divide((1024*1024),2);
            return string.valueOf(mb) + ' MB';
        } else {
            //GB
            Decimal gb = Decimal.valueOf(Value);
            gb = gb.divide((1024*1024*1024),2);
            return string.valueOf(gb) + ' GB';
        }    
    }

    public class ContentVersionWrapper {
        @AuraEnabled
        public String name {get; set;}
        @AuraEnabled
        public String body {get; set;}
        @AuraEnabled
        public ContentVersion cv;
        
        public ContentVersionWrapper(ContentVersion contentVer) {
            this.cv = contentVer;
            this.name = contentVer.Title + '.' + contentVer.FileExtension;
            this.body = EncodingUtil.base64Encode(contentVer.VersionData);
        }
    }

    public class PDFTronException extends Exception {}
}