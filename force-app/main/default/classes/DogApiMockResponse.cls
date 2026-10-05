@isTest
public class DogApiMockResponse implements HttpCalloutMock {
    
    public HTTPResponse respond(HTTPRequest request) {
        HttpResponse response = new HttpResponse();
        response.setHeader('Content-Type', 'application/json');
        response.setStatusCode(200);
        
        String mockBody = '{'
            + '"data": ['
            +   '{'
            +     '"id": "036feed0-da8a-42c9-ab9a-57449b530b13",'
            +     '"type": "breed",'
            +     '"attributes": {'
            +       '"name": "Affenpinscher",'
            +       '"description": "A small and playful breed.",'
            +       '"hypoallergenic": true,'
            +       '"life": { "min": 14, "max": 16 }'
            +     '}'
            +   '},'
            +   '{'
            +     '"id": "e7e99424-d514-4b56-9f0c-05736f6dd22d",'
            +     '"type": "breed",'
            +     '"attributes": {'
            +       '"name": "Akita",'
            +       '"description": "A large, muscular dog breed.",'
            +       '"hypoallergenic": false,'
            +       '"life": { "min": 10, "max": 14 }'
            +     '}'
            +   '}'
            + '],'
            + '"meta": {'
            +   '"pagination": {'
            +     '"current": 1,'
            +     '"next": 2,'
            +     '"last": 2,'
            +     '"records": 340'
            +   '}'
            + '}'
            + '}';
        
        response.setBody(mockBody);
        return response;
    }
}