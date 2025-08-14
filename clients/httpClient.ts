
import { APIRequestContext, request, expect } from '@playwright/test';


/**
 * HttpClient is a wrapper around Playwright's APIRequestContext, designed to simplify HTTP API testing.
 * It provides convenient methods for common HTTP operations and manages request context initialization.
 * This class is intended for use in API automation scenarios, allowing for easy setup of base URLs and headers.
 */
export class HttpClient {
    // Holds the Playwright APIRequestContext, which manages HTTP requests and session state.
    private ctx!: APIRequestContext;

    /**
     * Initializes the HTTP client with a base URL and optional headers.
     * This sets up a new Playwright request context, which can be reused for multiple requests.
     * @param baseURL The base URL for all requests made by this client.
     * @param headers Optional HTTP headers to include with every request (e.g., auth tokens).
     */
    async init(baseURL: string, headers?: Record<string, string>) {
        this.ctx = await request.newContext({
            baseURL,
            extraHTTPHeaders: headers
        });
    }

    /**
     * Exposes the underlying Playwright APIRequestContext for advanced usage or direct access.
     */
    get context() {
        return this.ctx;
    }

    /**
     * Sends a GET request to the specified URL with optional query parameters.
     * Automatically asserts that the response is successful (status 2xx/3xx).
     * @param url The endpoint to send the GET request to.
     * @param params Optional query parameters as a key-value object.
     * @returns The Playwright APIResponse object.
     */
    async get(url: string, params?: Record<string, any>) {
        const res = await this.ctx.get(url, { params });
        // Ensures the response is OK, failing the test if not.
        expect(res.ok()).toBeTruthy();
        return res;
    }

    /**
     * Sends a POST request to the specified URL with optional payload data.
     * @param url The endpoint to send the POST request to.
     * @param data Optional request body (JSON, form data, etc.).
     * @returns The Playwright APIResponse object.
     */
    async post(url: string, data?: any) {
        const res = await this.ctx.post(url, { data });
        return res;
    }

    /**
     * Sends a PUT request to the specified URL with optional payload data.
     * @param url The endpoint to send the PUT request to.
     * @param data Optional request body.
     * @returns The Playwright APIResponse object.
     */
    async put(url: string, data?: any) {
        return this.ctx.put(url, { data });
    }

    /**
     * Sends a PATCH request to the specified URL with optional payload data.
     * @param url The endpoint to send the PATCH request to.
     * @param data Optional request body.
     * @returns The Playwright APIResponse object.
     */
    async patch(url: string, data?: any) {
        return this.ctx.patch(url, { data });
    }

    /**
     * Sends a DELETE request to the specified URL.
     * @param url The endpoint to send the DELETE request to.
     * @returns The Playwright APIResponse object.
     */
    async delete(url: string) {
        return this.ctx.delete(url);
    }
}
