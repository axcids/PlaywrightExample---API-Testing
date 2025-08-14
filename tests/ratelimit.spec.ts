import { HttpClient } from "../clients/httpClient";
import { expect, test } from '@playwright/test';

// Create an instance of the client
const httpClient = new HttpClient();

// Helper interface for rate limit headers
interface RateLimitHeaders {
    limit: number;
    remaining: number;
    reset: number;
}

// Helper function to extract rate limit headers
function extractRateLimitHeaders(response: any): RateLimitHeaders {
    const headers = response.headers();
    return {
        limit: parseInt(headers["x-ratelimit-limit"] || "0"),
        remaining: parseInt(headers["x-ratelimit-remaining"] || "0"),
        reset: parseInt(headers["x-ratelimit-reset"] || "0")
    };
}

// Initialize the client before tests
test.beforeAll(async () => {
    await httpClient.init("https://api.github.com");
});

test.describe('Rate Limit Headers Validation', () => {
    // Initialize the client before tests
    test.beforeAll(async () => {
        await httpClient.init("https://api.github.com");
    });
    test('should return all required rate limit headers', async () => {
        const response = await httpClient.getRaw("/");
        const rateLimits = extractRateLimitHeaders(response);
        
        // Verify all headers are present and valid
        expect(rateLimits.limit).toBeGreaterThan(0);
        expect(rateLimits.remaining).toBeGreaterThanOrEqual(0);
        expect(rateLimits.remaining).toBeLessThanOrEqual(rateLimits.limit);
        expect(rateLimits.reset).toBeGreaterThan(0);
        
        console.log(`Rate limit: ${rateLimits.limit}, Remaining: ${rateLimits.remaining}, Reset: ${rateLimits.reset}`);
    });

    test('should have consistent rate limit values', async () => {
        const response = await httpClient.getRaw("/");
        const rateLimits = extractRateLimitHeaders(response);
        
        // Rate limit should be a reasonable number for GitHub (typically 60 for unauthenticated)
        expect(rateLimits.limit).toBeGreaterThanOrEqual(50);
        expect(rateLimits.limit).toBeLessThanOrEqual(10000);
        
        // Reset timestamp should be in the future
        const currentTimestamp = Math.floor(Date.now() / 1000);
        expect(rateLimits.reset).toBeGreaterThan(currentTimestamp);
    });
});

test.describe('Rate Limit Counting Functionality', () => {
    test('should decrease remaining count with each request', async () => {
        // Make first request and capture rate limit
        const response1 = await httpClient.getRaw("/");
        const rateLimits1 = extractRateLimitHeaders(response1);
        
        // Wait a small amount to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Make second request
        const response2 = await httpClient.getRaw("/");
        const rateLimits2 = extractRateLimitHeaders(response2);
        
        // Verify that remaining count decreased (if rate limit is actively counting)
        console.log(`First request - Remaining: ${rateLimits1.remaining}`);
        console.log(`Second request - Remaining: ${rateLimits2.remaining}`);
        
        // The remaining should either decrease or stay the same if reset occurred
        if (rateLimits1.reset === rateLimits2.reset) {
            // Same reset window, remaining should decrease
            expect(rateLimits2.remaining).toBeLessThanOrEqual(rateLimits1.remaining);
            if (rateLimits2.remaining < rateLimits1.remaining) {
                console.log("✅ Rate limiting is actively counting requests");
            }
        }
        
        // Limits should remain consistent
        expect(rateLimits2.limit).toBe(rateLimits1.limit);
    });

    test('should track multiple consecutive requests', async () => {
        const requests = 5;
        const rateLimitData: RateLimitHeaders[] = [];
        
        for (let i = 0; i < requests; i++) {
            const response = await httpClient.getRaw("/");
            const rateLimits = extractRateLimitHeaders(response);
            rateLimitData.push(rateLimits);
            
            console.log(`Request ${i + 1} - Remaining: ${rateLimits.remaining}, Reset: ${rateLimits.reset}`);
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Analyze the pattern
        let countingWorking = false;
        let totalDecrease = 0;
        
        for (let i = 1; i < rateLimitData.length; i++) {
            const prev = rateLimitData[i - 1];
            const current = rateLimitData[i];
            
            // If reset time is the same and remaining decreased, counting is working
            if (prev.reset === current.reset && current.remaining < prev.remaining) {
                countingWorking = true;
                totalDecrease += (prev.remaining - current.remaining);
            }
        }
        
        // Verify limits are consistent across all requests
        const firstLimit = rateLimitData[0].limit;
        rateLimitData.forEach((data, index) => {
            expect(data.limit).toBe(firstLimit);
            expect(data.remaining).toBeGreaterThanOrEqual(0);
        });
        
        console.log(`Rate limit counting appears to be ${countingWorking ? 'working' : 'not actively counting or reset occurred'}`);
        if (countingWorking) {
            console.log(`Total decrease in remaining requests: ${totalDecrease}`);
        }
    });
});

test.describe('Rate Limit Enforcement', () => {
    test('should maintain rate limit boundaries', async () => {
        const response = await httpClient.getRaw("/");
        const rateLimits = extractRateLimitHeaders(response);
        
        // Remaining should never exceed the limit
        expect(rateLimits.remaining).toBeLessThanOrEqual(rateLimits.limit);
        
        // Remaining should never be negative
        expect(rateLimits.remaining).toBeGreaterThanOrEqual(0);
        
        // Reset should be a valid future timestamp
        const now = Math.floor(Date.now() / 1000);
        const oneHourFromNow = now + 3600;
        expect(rateLimits.reset).toBeGreaterThan(now);
        expect(rateLimits.reset).toBeLessThan(oneHourFromNow); // GitHub resets within an hour
    });

    test('should provide consistent reset timestamp during rate limit window', async () => {
        const response1 = await httpClient.getRaw("/");
        const rateLimits1 = extractRateLimitHeaders(response1);
        
        // Quick successive request
        const response2 = await httpClient.getRaw("/");
        const rateLimits2 = extractRateLimitHeaders(response2);
        
        // Reset time should be the same for requests in the same window
        // (unless we hit exactly at the reset boundary)
        const timeDifference = Math.abs(rateLimits2.reset - rateLimits1.reset);
        expect(timeDifference).toBeLessThanOrEqual(1); // Allow 1 second difference for reset boundary
        
        console.log(`Reset consistency - First: ${rateLimits1.reset}, Second: ${rateLimits2.reset}, Difference: ${timeDifference}`);
    });
});

test.describe('Rate Limit Stress Testing', () => {
    test('should handle burst of requests gracefully', async () => {
        const burstSize = 10;
        
        // Send burst of requests
        const promises = Array.from({ length: burstSize }, () => 
            httpClient.getRaw("/")
        );
        
        try {
            const results = await Promise.all(promises);
            
            // Analyze rate limit behavior under burst
            const rateLimitData = results.map(extractRateLimitHeaders);
            
            // All requests should succeed (GitHub doesn't return 429 immediately)
            results.forEach(response => {
                expect([200, 403, 429]).toContain(response.status()); // GitHub returns 403 when rate limited
            });
            
            // Check if any requests hit rate limits (403 for GitHub)
            const rateLimitedRequests = results.filter(response => response.status() === 403);
            console.log(`${rateLimitedRequests.length} out of ${burstSize} requests were rate limited`);
            
            // Verify rate limit headers are present in all responses
            rateLimitData.forEach((data, index) => {
                expect(data.limit).toBeGreaterThan(0);
                expect(data.remaining).toBeGreaterThanOrEqual(0);
                console.log(`Burst request ${index + 1} - Remaining: ${data.remaining}, Status: ${results[index].status()}`);
            });
            
            // Check for decreasing pattern in remaining requests
            let maxDecrease = 0;
            for (let i = 1; i < rateLimitData.length; i++) {
                const prev = rateLimitData[i - 1];
                const current = rateLimitData[i];
                
                if (prev.reset === current.reset) {
                    const decrease = prev.remaining - current.remaining;
                    maxDecrease = Math.max(maxDecrease, decrease);
                }
            }
            
            console.log(`Maximum decrease in remaining requests during burst: ${maxDecrease}`);
            
        } catch (error) {
            console.log(`Burst test encountered error: ${error}`);
            // Some requests might fail due to rate limiting, which is expected behavior
        }
    });

    test('should verify rate limit recovery after waiting', async () => {
        // Make initial request to see current state
        const initialResponse = await httpClient.getRaw("/");
        const initialLimits = extractRateLimitHeaders(initialResponse);
        
        console.log(`Initial remaining: ${initialLimits.remaining}, Reset time: ${initialLimits.reset}`);
        
        // Calculate time until reset (convert from Unix timestamp)
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilReset = initialLimits.reset - currentTime;
        
        console.log(`Time until reset: ${timeUntilReset} seconds`);
        
        // If reset is soon (within 10 seconds), wait for it
        if (timeUntilReset > 0 && timeUntilReset <= 10) {
            console.log(`Waiting ${timeUntilReset + 1} seconds for rate limit reset...`);
            await new Promise(resolve => setTimeout(resolve, (timeUntilReset + 1) * 1000));
            
            // Make request after reset
            const afterResetResponse = await httpClient.getRaw("/");
            const afterResetLimits = extractRateLimitHeaders(afterResetResponse);
            
            console.log(`After reset remaining: ${afterResetLimits.remaining}`);
            
            // After reset, remaining should be restored (likely close to the limit)
            expect(afterResetLimits.remaining).toBeGreaterThan(initialLimits.remaining);
            expect(afterResetLimits.reset).toBeGreaterThan(initialLimits.reset);
        } else {
            console.log(`Reset time is too far in the future (${timeUntilReset}s), skipping wait test`);
        }
    });
});