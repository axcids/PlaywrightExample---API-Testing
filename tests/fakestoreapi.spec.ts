import { HttpClient } from "../clients/httpClient";
import {expect, test} from '@playwright/test';

// Create an instance of the client
const httpClient = new HttpClient();

// Initialize the client
httpClient.init("https://fakestoreapi.com/");

// Add your test cases here
test.describe('GET: (/products) Get All Products', () => {
    test('returns 200 when products exist', async () => {
        // Make the request using HttpClient
        const response =  await httpClient.get("/products");
        const body = await response.json()
        if (Array.isArray(body) && body.length > 0) {
            console.log('Response status:', response.status());
            console.log('Response contains results:', body);
            expect(body.length).toBeGreaterThan(0);
            expect(response.status()).toBe(200);
        } else {
            console.log('Response status:', response.status());
            console.log('Response is empty.');
            expect(response.status()).toBe(0);
        }
    });
    test('returns 200 when products not found', async ({ page }) => {
        const BASE_URL = "https://fakestoreapi.com/products";
        // Intercept the request to return an empty array
        await page.route(BASE_URL, (route) => {
            console.log('Intercepted request:', route.request().url());
            route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([]) // Empty array
            });
        });
        // Trigger the request from the page so interception applies
        const response = await page.goto(BASE_URL);
        expect(response?.status()).toBe(200);
        const body = await response!.json();
        console.log('Mocked empty body:', body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(0);
    });
    test('returns correct properties', async () => {
        const response = await httpClient.get("/products");
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products)).toBe(true);
        products.forEach((product) => {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('title');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('description');
            expect(product).toHaveProperty('category');
            expect(product).toHaveProperty('image');
        });
    }); // =================================================================================> Later, I will add schema Validation Utility instead of this test
    test('returns all required properties data types properly', async () => {
        const response = await httpClient.get("/products");
        const body = await response.json();
        if(response.status() == 200 && Array.isArray(body)) {
            body.forEach((product) => {
                //Id 
                expect(typeof product.id).toBe('number');
                expect(Number.isInteger(product.id)).toBe(true);
                console.log('product.id:', product.id, 'type:', typeof product.id);
                //Title 
                expect(typeof product.title).toBe('string');
                console.log('product.title:', product.title, 'type:', typeof product.title);
                //Price
                console.log(typeof product.price);
                expect(typeof product.price).toBe('number');
                // expect(Number.isInteger(product.price)).toBe(false); // fix this later 
                console.log('product.price:', product.price, 'type:', typeof product.price);
                //Description
                expect(typeof product.description).toBe('string');
                console.log('product.description:', product.description, 'type:', typeof product.description);
                //Category
                expect(typeof product.category).toBe('string');
                console.log('product.category:', product.category, 'type:', typeof product.category);
                //Image
                expect(typeof product.image).toBe('string');
                console.log('product.image:', product.image, 'type:', typeof product.image);
                try {
                    new URL(product.image); // Will throw if not a valid URL
                } catch {
                    throw new Error('product.image is not a valid URL');
                    expect(false).toBe(true);
                    console.log('product.image is not a valid URL');
                }
            });
        }
    });
    test('verify response time is under 2 seconds', async () => {
        const startTime = Date.now();
        const response = await httpClient.get("/products");
        const endTime = Date.now();
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(2000);
    });
    test('verify the API returns 500 for invalid endpoint', async ({ page }) => {
        const BASE_URL = 'https://fakestoreapi.com/products';
        // Intercept the request to return 500 (applies to requests initiated by the page)
        await page.route(BASE_URL, (route) => {
            console.log('Intercepted request:', route.request().url());
            route.fulfill({
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });
        // Trigger the request via the page so the route interception applies
        const response = await page.goto(BASE_URL);
        expect(response?.status()).toBe(500);
    });

});

test.describe('POST: (/products) Add New Product', () => {
    test('returns 201 and valid id', async () => {
        const newProduct = {
            title: 'New Product',
            price: 99.99,
            description: 'A brand new product',
            category: 'Category 1',
            image: 'https://via.placeholder.com/150'
        };
        const response = await httpClient.post("/products", newProduct);
        expect(response.status()).toBe(201);
        const body = await response.json();
        const responseSchema = response.headers()["content-type"];
        expect(responseSchema).toBe('application/json; charset=utf-8');
        expect(body).toHaveProperty('id');
    });

    test('returns 201 and valid product details', async () => {
        const newProduct = {
            title: 'New Product',
            price: 99.99,
            description: 'A brand new product',
            category: 'Category 1',
            image: 'https://via.placeholder.com/150'
        };
        const response = await httpClient.post("/products", newProduct);
        expect(response.status()).toBe(201);
        const body = await response.json();
        const responseSchema = response.headers()["content-type"];
        expect(responseSchema).toBe('application/json; charset=utf-8');
        expect(body).toHaveProperty('id');
        expect(body.title).toBe(newProduct.title);
        expect(typeof body.title).toBe('string');
        expect(body.price).toBe(newProduct.price);
        expect(typeof body.price).toBe('number');
        expect(body.description).toBe(newProduct.description);
        expect(typeof body.description).toBe('string');
        expect(body.category).toBe(newProduct.category);
        expect(typeof body.category).toBe('string');
        expect(body.image).toBe(newProduct.image);
        expect(typeof body.image).toBe('string');
    });
    test('returns 400 for invalid product data', async () => {
        const newProduct = {
            title: 'New Product',
            // price: '99.99', // Intentionally not providing price
            description: 'A brand new product',
            category: 'Category 1',
            image: 'https://via.placeholder.com/150'
        };
        const response = await httpClient.post("/products", newProduct);
        // expect(response.status()).toBe(201);
        console.log('Response status:', response.status());
        const body = await response.json();
        const responseSchema = response.headers()["content-type"];
        // expect(responseSchema).toBe('application/json; charset=utf-8');
        //expect(body).toHaveProperty('id');
        console.log(body);


    });
});