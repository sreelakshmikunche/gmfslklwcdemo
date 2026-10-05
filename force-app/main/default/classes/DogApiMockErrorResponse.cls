@isTest
public class DogApiMockErrorResponse implements HttpCalloutMock {
    
    public HTTPResponse respond(HTTPRequest request) {
        HttpResponse response = new HttpResponse();
        response.setStatusCode(500);
        response.setBody('Internal Server Error');
        return response;
    }
}