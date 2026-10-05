public with sharing class DogBreedController {

    public class BreedData {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public Integer minLife;
        @AuraEnabled public Integer maxLife;
        @AuraEnabled public String description;
        @AuraEnabled public Boolean hypoallergenic;
    }

    public class BreedPage{
        @AuraEnabled public List<BreedData> breeds;
        @AuraEnabled public Integer currentPage;
        @AuraEnabled public Integer lastPage;
        @AuraEnabled public Integer totalRecords;
        
    }

    //Callout to Dog API v2
    @AuraEnabled(Cacheable =true)
    public static BreedPage getDogBreeds(Integer pageNumber, Integer pageSize) {
        BreedPage result = new BreedPage();
        result.breeds = new List<BreedData>();
        
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        String endpoint = 'callout:Dog_API/api/v2/breeds'
            + '?page%5Bnumber%5D=' + pageNumber   
            + '&page%5Bsize%5D=' + pageSize;      
        request.setEndpoint(endpoint);
        request.setMethod('GET');
        request.setHeader('Accept', 'application/json');

        try {
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                List<Object> data = (List<Object>) root.get('data');

                for (Object item : data) {
                    Map<String, Object> breedMap = (Map<String, Object>) item;
                    Map<String, Object> attributes = (Map<String, Object>) breedMap.get('attributes');
                    
                    BreedData breed = new BreedData();
                    breed.id = (String) breedMap.get('id');
                    breed.name = (String) attributes.get('name');
                    breed.description = (String) attributes.get('description');
                    Object hypoallergenicRaw = attributes.get('hypoallergenic');
                    breed.hypoallergenic = (hypoallergenicRaw != null) ? (Boolean) hypoallergenicRaw : false;
                    
                    Map<String, Object> lifeSpan = (Map<String, Object>) attributes.get('life');
                    if (lifeSpan != null) {
                        breed.minLife = (Integer) lifeSpan.get('min');
                        breed.maxLife = (Integer) lifeSpan.get('max');
                    }
                    
                    result.breeds.add(breed);
                }
                Map<String, Object> meta = (Map<String, Object>) root.get('meta');
                if (meta != null) {
                    Map<String, Object> pagination = (Map<String, Object>) meta.get('pagination');
                    if (pagination != null) {
                        result.currentPage = (Integer) pagination.get('current');
                        result.lastPage = (Integer) pagination.get('last');
                        result.totalRecords = (Integer) pagination.get('records');
                    }
                }
            } 
            else {
                throw new AuraHandledException('Error occured when calling Dog API with Status: ' + response.getStatus());
            }
        } 
        catch (Exception e) {
            throw new AuraHandledException('Callout failed: ' + e.getMessage());
        }
        return result;
    }

    
    //Save selected breed to Salesforce object
    
    @AuraEnabled
    public static void saveAssignedDogFact(String firstName, String lastName, String strSelectedBreed) {
        BreedData selectedBreed = (BreedData) JSON.deserialize(strSelectedBreed, BreedData.class);
        // System.debug('selected breed : '+ JSON.serialize(selectedBreed) );

        if (String.isBlank(firstName) || String.isBlank(lastName)) {
            throw new AuraHandledException('First Name and Last Name are required.');
        }
        if (selectedBreed == null) {
            throw new AuraHandledException('No breed selected.');
        }
        
        Assigned_Dog_Facts__c newFact = new Assigned_Dog_Facts__c();
        newFact.User_Full_Name__c = firstName.trim() + ' ' + lastName.trim();
        newFact.Breed_Name__c = selectedBreed.name;
        newFact.Description__c = selectedBreed.description;
        newFact.Minimum_Life__c= selectedBreed.minLife;
        newFact.Maximum_Life__c = selectedBreed.maxLife;
        newFact.Hypoallergenic__c = selectedBreed.hypoallergenic != null ? selectedBreed.hypoallergenic : false;
        newFact.Requested_Date_Time__c = System.now();

        try {
            insert newFact;
        } 
        catch (Exception e) {
            throw new AuraHandledException('Failed to save assignment: ' + e.getMessage());
        }
    }
}