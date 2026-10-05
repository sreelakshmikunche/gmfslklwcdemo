@isTest
private class DogBreedControllerTest {

   
    @isTest
    static void testGetDogBreeds_Success() {
        Test.setMock(HttpCalloutMock.class, new DogApiMockResponse());

        Test.startTest();
        DogBreedController.BreedPage result = DogBreedController.getDogBreeds(1, 25);
        Test.stopTest();

        System.assertNotEquals(null, result, 'BreedPage should not be null');
        System.assertEquals(2, result.breeds.size(), 'Should parse 2 breeds from mock response');
        System.assertEquals('Affenpinscher', result.breeds[0].name);
        System.assertEquals(true, result.breeds[0].hypoallergenic);
        System.assertEquals(14, result.breeds[0].minLife);
        System.assertEquals(16, result.breeds[0].maxLife);
        System.assertEquals(1, result.currentPage);
        System.assertEquals(2, result.lastPage);
        System.assertEquals(340, result.totalRecords);
    }

    // ---- getDogBreeds: API returns an error status ----
    @isTest
    static void testGetDogBreeds_ApiError() {
        Test.setMock(HttpCalloutMock.class, new DogApiMockErrorResponse());

        Test.startTest();
        try {
            DogBreedController.getDogBreeds(1, 25);
            System.assert(false, 'Expected an AuraHandledException to be thrown');
        } catch (AuraHandledException e) {
            System.assert(true, 'Exception correctly thrown on API error');
        }
        Test.stopTest();
    }

    // ---- saveAssignedDogFact: happy path ----
    @isTest
    static void testSaveAssignedDogFact_Success() {
        DogBreedController.BreedData testBreed = new DogBreedController.BreedData();
        testBreed.id = 'test-id-123';
        testBreed.name = 'Test Breed';
        testBreed.description = 'A breed used for testing.';
        testBreed.minLife = 10;
        testBreed.maxLife = 15;
        testBreed.hypoallergenic = true;

        String breedJson = JSON.serialize(testBreed);

        Test.startTest();
        DogBreedController.saveAssignedDogFact('John', 'Doe', breedJson);
        Test.stopTest();

        List<Assigned_Dog_Facts__c> facts = [
            SELECT User_Full_Name__c, Breed_Name__c, Description__c,
                   Minimum_Life__c, Maximum_Life__c, Hypoallergenic__c
            FROM Assigned_Dog_Facts__c
        ];

        System.assertEquals(1, facts.size(), 'One record should be inserted');
        System.assertEquals('John Doe', facts[0].User_Full_Name__c);
        System.assertEquals('Test Breed', facts[0].Breed_Name__c);
        System.assertEquals(10, facts[0].Minimum_Life__c);
        System.assertEquals(15, facts[0].Maximum_Life__c);
        System.assertEquals(true, facts[0].Hypoallergenic__c);
    }

    // ---- saveAssignedDogFact: hypoallergenic null defaults to false ----
    @isTest
    static void testSaveAssignedDogFact_NullHypoallergenicDefaultsFalse() {
        DogBreedController.BreedData testBreed = new DogBreedController.BreedData();
        testBreed.id = 'test-id-456';
        testBreed.name = 'Null Hypo Breed';
        testBreed.description = 'Testing null hypoallergenic handling.';
        testBreed.minLife = 8;
        testBreed.maxLife = 12;
        testBreed.hypoallergenic = null;

        String breedJson = JSON.serialize(testBreed);

        Test.startTest();
        DogBreedController.saveAssignedDogFact('Jane', 'Smith', breedJson);
        Test.stopTest();

        Assigned_Dog_Facts__c fact = [
            SELECT Hypoallergenic__c FROM Assigned_Dog_Facts__c LIMIT 1
        ];
        System.assertEquals(false, fact.Hypoallergenic__c, 'Null hypoallergenic should default to false');
    }

    // ---- saveAssignedDogFact: missing first/last name throws error ----
    @isTest
    static void testSaveAssignedDogFact_MissingName_ThrowsException() {
        DogBreedController.BreedData testBreed = new DogBreedController.BreedData();
        testBreed.name = 'Test Breed';
        String breedJson = JSON.serialize(testBreed);

        Test.startTest();
        try {
            DogBreedController.saveAssignedDogFact('', 'Doe', breedJson);
            System.assert(false, 'Expected exception for missing first name');
        } catch (AuraHandledException e) {
            System.assert(true, 'Exception correctly thrown for blank first name');
        }
        Test.stopTest();
    }

    // ---- saveAssignedDogFact: null breed throws error ----
    @isTest
    static void testSaveAssignedDogFact_NullBreed_ThrowsException() {
        Test.startTest();
        try {
            DogBreedController.saveAssignedDogFact('John', 'Doe', null);
            System.assert(false, 'Expected exception for null breed JSON');
        } catch (Exception e) {
            // JSON.deserialize(null, ...) throws a JSONException before reaching
            // the selectedBreed == null check -- both are acceptable failure modes
            System.assert(true, 'Exception correctly thrown for null breed input');
        }
        Test.stopTest();
    }
}