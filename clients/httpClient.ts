import { APIRequestContext, request, expect } from '@playwright/test';



// HttpClient wraps Playwright's APIRequestContext for API testing.
export class HttpClient {
    // Playwright request context for HTTP calls.
    private ctx!: APIRequestContext;

    // Set up context with base URL and headers.
    async init(baseURL: string, headers?: Record<string, string>) {
        const defaultUserAgent =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
        const mergedHeaders = {
            'User-Agent': defaultUserAgent,
            ...(headers || {})
        };
        this.ctx = await request.newContext({ baseURL, extraHTTPHeaders: mergedHeaders });
    }

    // Access the raw Playwright context.
    get context() {
        return this.ctx;
    }

    // GET request with optional params. Asserts response is OK.
    async get(url: string, params?: Record<string, any>) {
        const res = await this.ctx.get(url, { params });
        expect(res.status()).toBe(200);
        return res;
    }

    // GET request without status assertion (for rate limit testing)
    async getRaw(url: string, params?: Record<string, any>) {
        return await this.ctx.get(url, { params });
    }

    // POST request with optional data.
    async post(url: string, data?: any) {
        return this.ctx.post(url, { data });
    }

    // PUT request with optional data.
    async put(url: string, data?: any) {
        return this.ctx.put(url, { data });
    }

    // PATCH request with optional data.
    async patch(url: string, data?: any) {
        return this.ctx.patch(url, { data });
    }

    // DELETE request.
    async delete(url: string) {
        return this.ctx.delete(url);
    }

}
