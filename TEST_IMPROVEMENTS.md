# Test Improvements Needed

## 🚨 **High Priority - Route Test Infrastructure**

The user route tests have a fundamental issue: the middleware mocking doesn't properly simulate missing user scenarios.

### **Problem:**
- Tests mock middleware to set `req.userContext.mongoUser = null`
- But the global middleware mock always provides a valid user context
- So routes never actually hit the "missing user" condition

### **Solution Options:**

#### **Option 1: Fix Middleware Mocking (Recommended)**
```typescript
// In beforeEach, conditionally mock middleware
beforeEach(() => {
  // Reset to default mock
  vi.mocked(syncAuth0User).mockImplementation((req: any, res: any, next: any) => {
    req.userContext = {
      mongoUser: {
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        // ... other fields
      },
      auth0User: req.auth0User,
      userId: 'auth0|test123'
    };
    req.user = req.userContext.mongoUser;
    next();
  });
});

// For specific tests, override the mock
it('should return 404 when user not found', async () => {
  vi.mocked(syncAuth0User).mockImplementationOnce((req: any, res: any, next: any) => {
    req.userContext = {
      mongoUser: null,
      auth0User: null,
      userId: null
    };
    next();
  });

  const response = await request(app)
    .get('/api/user/profile')
    .expect(404);
    
  expect(response.body.error).toBe('User profile not found');
});
```

#### **Option 2: Test Route Logic Directly**
```typescript
// Test the route handlers directly without Express app
import { getUserProfileHandler } from '../routes/user-route';

it('should return 404 when mongoUser is null', async () => {
  const mockReq = {
    userContext: { mongoUser: null }
  };
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };

  await getUserProfileHandler(mockReq, mockRes);

  expect(mockRes.status).toHaveBeenCalledWith(404);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: false,
    error: 'User profile not found'
  });
});
```

## 📋 **Test Coverage Improvements**

### **Add Missing Tests:**

1. **Authentication Middleware Edge Cases:**
   ```typescript
   // Test JWT token expiration
   // Test malformed tokens
   // Test missing Auth0 config
   ```

2. **Rate Limiting Tests:**
   ```typescript
   // Test rate limit exceeded scenarios
   // Test rate limit reset
   ```

3. **Validation Middleware:**
   ```typescript
   // Test nested object validation
   // Test array validation
   // Test custom validation rules
   ```

4. **Integration Tests:**
   ```typescript
   // Test full request flow: auth → validation → service → response
   // Test error propagation through middleware stack
   ```

## 🎯 **Quick Wins:**

1. **Fix the 5 failing route tests** using Option 1 above
2. **Add integration tests** for critical user flows
3. **Add performance tests** for rate limiting
4. **Add contract tests** between client and server APIs

## 📊 **Current Test Quality: B+**

**Strengths:**
- Excellent service layer coverage
- Good utility function testing
- Comprehensive client component tests
- Good error handling coverage

**Areas for Improvement:**
- Route test infrastructure
- Integration test coverage
- Performance test coverage
- Edge case coverage in middleware
