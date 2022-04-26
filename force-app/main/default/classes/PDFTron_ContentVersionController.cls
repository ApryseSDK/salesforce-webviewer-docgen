public with sharing class PDFTron_ContentVersionController {
    private final static Integer MAX_RESULTS = 7;

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
    public static String saveDocument(String json, String recordId, String cvId) {
        try {
            //parse annotated document payload and create new ContentVersion
            PDFTron_ContentVersionPayload pl = new PDFTron_ContentVersionPayload(json);
            ContentVersion annotatedCv = new ContentVersion();

            //retrieve original document before annotation
            List<ContentVersion> cvList = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cvId];

            if(cvList.size() == 1) {
                //retrieve and delete original document
                List<ContentDocument> originalDocument = [SELECT Id FROM ContentDocument WHERE Id = :cvList[0].ContentDocumentId];
                
            } else {
                System.debug('Could not retrieve record for ' + cvId);
            }
            //build document blob
            annotatedCv.VersionData = EncodingUtil.base64Decode(pl.base64Data);
            annotatedCv.Title = pl.title;
            annotatedCv.PathOnClient = pl.filename;

            insert annotatedCv; 

            if(annotatedCv.ContentDocumentId == null && String.isNotBlank(recordId)) {
                //get the content version since ContentDocumentId is defined after insert
                List<ContentVersion> contentVersions = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id =: annotatedCv.Id LIMIT 1];

                //link record with document
                ContentDocumentLink contentDocumentLink = new ContentDocumentLink(LinkedEntityId = recordId, ContentDocumentId = contentVersions[0].ContentDocumentId, ShareType = 'V');
                insert contentDocumentLink;
            }

            return annotatedCv.Id;
        } catch (Exception e) {
            system.debug('### ERROR: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String createCMTRecord(String jsonString){
        try {
            Map<String, Object> parsedData = (Map<String, Object>)JSON.deserializeUntyped(jsonString);
            system.debug('##mappy: ' + parsedData);
            Map<String, Object> cmt_map = new Map<String, Object>();
            cmt_map.put('Mapping__c', String.valueOf(parsedData.get('mapping')));
            cmt_map.put('sObject__c', parsedData.get('sObjectName'));
            cmt_map.put('Template_Name__c', parsedData.get('templateName'));
            cmt_map.put('Template_Id__c', parsedData.get('templateId'));

            String cmtName = String.valueOf(parsedData.get('cmtName'));

            String recordName = 'PDFTron_Template_Mapping.' + cmtName;

            system.debug('### rec name: '+recordName);

            PDFTron_CMT_Helper.createUpdateMetadata(recordName, recordName, cmt_map);
            return 'Done!';
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true)
    public static List<LookupSearchResult> searchSOSL(String searchTerm, List<String> selectedIds) {
        // Prepare query paramters
        searchTerm += '*';

        // Execute search query
        List<List<SObject>> searchResults = [
            FIND :searchTerm
            IN ALL FIELDS
            RETURNING
                Account(Id, Name, BillingCity WHERE id NOT IN :selectedIds),
                Opportunity(Id, Name, StageName WHERE id NOT IN :selectedIds),
                Contact(Id, FirstName, LastName WHERE id NOT IN :selectedIds)
            LIMIT :MAX_RESULTS
        ];

        // Prepare results
        List<LookupSearchResult> results = new List<LookupSearchResult>();

        // Extract Accounts & convert them into LookupSearchResult
        String accountIcon = 'standard:account';
        Account[] accounts = (List<Account>) searchResults[0];
        for (Account account : accounts) {
            String subtitle = account.BillingCity == null ? 'Account' : 'Account • ' + account.BillingCity;
            results.add(new LookupSearchResult(account.Id, 'Account', accountIcon, account.Name, subtitle));
        }

        // Extract Opportunities & convert them into LookupSearchResult
        String opptyIcon = 'standard:opportunity';
        Opportunity[] opptys = (List<Opportunity>) searchResults[1];
        for (Opportunity oppty : opptys) {
            results.add(
                new LookupSearchResult(
                    oppty.Id,
                    'Opportunity',
                    opptyIcon,
                    oppty.Name,
                    'Opportunity • ' + oppty.StageName
                )
            );
        }

        // Extract Opportunities & convert them into LookupSearchResult
        String contactIcon = 'standard:contact';
        Contact[] contacts = (List<Contact>) searchResults[2];
        for (Contact con : contacts) {
            results.add(
                new LookupSearchResult(
                    con.Id,
                    'Contact',
                    contactIcon,
                    con.FirstName + ' ' + con.LastName,
                    'Contact'
                )
            );
        }

        // Optionnaly sort all results on title
        results.sort();

        return results;
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

    @AuraEnabled(Cacheable=true)
    public static List<TemplateWrapper> getTemplateMappingResults() {

        // Prepare results
        List<TemplateWrapper> results = new List<TemplateWrapper>();
        String icon = 'doctype:unknown';

        for (PDFTron_Template_Mapping__mdt template : [
            SELECT id, sObject__c, Mapping__c, Template_Id__c, DeveloperName, Template_Name__c
            FROM PDFTron_Template_Mapping__mdt
        ]) {

            String subtitle = template.sObject__c + ' - ' + template.Template_Name__c;

            if (String.isNotBlank(template.sObject__c)){
                icon = 'standard:' + template.sObject__c.toLowerCase();
            }
            
            TemplateWrapper item = new TemplateWrapper(new LookupSearchResult(template.id, 'PDFTron_Template_Mapping__mdt', icon, template.DeveloperName, subtitle ), template);
            results.add(item);

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

    @AuraEnabled(cacheable=true)
    public static List<String> getSObjects(){
        try {
            List<string> sObjectList = new List<string>();

            for(Schema.SObjectType objTyp : Schema.getGlobalDescribe().Values()) {
            String name = objTyp.getDescribe().getName();
            // Exclude all the unwanted Sobjects e.g. History, Share etc..
                if((!name.containsignorecase('history') && !name.containsignorecase('tag')&&
                    !name.containsignorecase('share') && !name.containsignorecase('feed')) || 
                    name.toLowerCase().right(3) ==  '__c') {      
                        sObjectList.add(name);
                }
            }

            sObjectList.sort();
            return sObjectList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true)
    public static List<String> getObjectFields(String objectName){
        try {
            SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
            List<String> result = new List<String>();
            for(Schema.SObjectField field : objectType.getDescribe().fields.getMap().values()) {
                result.add(field + '');
            } 
            result.sort();
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true) 
    public static List<sobject> queryValuesFromRecord(String recordId, String objectName, List<String> fields) {
        Map<String, String> fieldMap = new Map<String, String> ();
        String recId = recordId;
        String query = 'SELECT ';
        for(String field : fields) {
            query += field + ', ';
        }

        query = query.substring(0, query.length() - 2);
        query += ' ';
        query += 'FROM ' + objectName + ' ';
        query += 'WHERE Id = :recId';

        List<sobject> sobjlist = Database.query(query);

        System.debug(sobjlist);
        return sobjlist;
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


    @AuraEnabled
    public static List<SObject> queryRecords(String query){
        try {

            return Database.query(query);
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
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

    // for (PDFTron_Template_Mapping__mdt cv : [
    //         SELECT id, sObject__c, Mapping__c, Template_Id__c, DeveloperName, Template_Name__c
    //         FROM PDFTron_Template_Mapping__mdt
    // ])

    public class TemplateWrapper {
        @AuraEnabled
        public LookupSearchResult lookup {get; set;}
        @AuraEnabled
        public PDFTron_Template_Mapping__mdt template {get; set;}

        public TemplateWrapper(LookupSearchResult lookup, PDFTron_Template_Mapping__mdt template){
            this.lookup = lookup;
            this.template = template;
        }
    }

    public class PDFTron_ContentVersionPayload {
        public String title {get; set;}
        public String filename {get; set;}
        public String base64Data {get; set;}
        public String contentDocumentId {get; set;}

        public PDFTron_ContentVersionPayload(String json) {
            PDFTron_ContentVersionPayload pl = (PDFTron_ContentVersionPayload) System.JSON.deserialize(json, PDFTron_ContentVersionPayload.class);
            this.title = pl.title;
            this.filename = pl.filename;
            this.base64Data = pl.base64Data;
            this.contentDocumentId = pl.contentDocumentId;
        }
    }

    public class PDFTronException extends Exception {}

    
}