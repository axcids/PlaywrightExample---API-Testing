# Playwright API Testing Example

API testing framework with TypeScript and Playwright showcasing different testing scenarios.

## Test Files

### `fakestoreapi.spec.ts`
- **API:** FakeStore API
- **Purpose:** Complete API testing suite (GET/POST)
- **Features:** Data validation, schema checking, performance testing, error mocking
- **Tests:** Product CRUD operations, response time validation, property/type checking

### `ratelimit.spec.ts`
- **API:** GitHub API  
- **Purpose:** Rate limiting behavior testing
- **Features:** Header validation, burst testing, rate limit tracking
- **Tests:** Rate limit headers, request counting, stress testing, recovery validation

### `test-http-client.spec.ts`
- **API:** FakeStore API
- **Purpose:** Basic HTTP client validation
- **Features:** Simple functionality test
- **Tests:** Basic GET request and response verification

## Quick Comparison

| File | Complexity | Focus | Key Feature |
|------|------------|-------|-------------|
| `fakestoreapi.spec.ts` | High | CRUD & Validation | Schema validation + mocking |
| `ratelimit.spec.ts` | High | Rate Limiting | Header tracking + stress testing |
| `test-http-client.spec.ts` | Low | Basic Testing | Simple client verification |

## Running Tests

```bash
npm install
npx playwright test                           # All tests
npx playwright test tests/fakestoreapi.spec.ts # Specific file
```

