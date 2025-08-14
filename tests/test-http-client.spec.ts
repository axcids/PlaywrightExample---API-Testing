// Import the client 
import { HttpClient } from "../clients/httpClient";
// Import testing utilities
import {expect, test} from '@playwright/test';

// Create an instance of the client
const httpClient = new HttpClient();

// Initialize the client
httpClient.init("https://fakestoreapi.com/");
// Add your test cases here
// Example test case
test('test example', async () => {
    const response = await httpClient.get("products/1");
    const context = await httpClient.context;
    const body = await response.text();
    console.log(body);
    expect(response).toBeDefined();
});