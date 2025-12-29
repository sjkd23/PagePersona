# Async Job Configuration

## Backend Environment Variables

Add these to your server `.env` file:

```bash
# Job Management Settings
JOB_TTL_SECONDS=3600              # Job record TTL (1 hour default)
JOB_LOCK_TTL_SECONDS=300          # Job lock TTL (5 minutes default)

# Existing Redis/Cache Settings (ensure these are configured)
REDIS_URL=redis://localhost:6379  # Redis connection URL
CACHE_TTL_SECONDS=3600            # Cache result TTL (1 hour default)
```

## Frontend Environment Variables

The frontend uses these polling defaults (can be overridden via PollOptions):

```typescript
// Default polling configuration
const DEFAULT_POLL_OPTIONS = {
  maxAttempts: 120,    // 2 minutes at 1 second intervals
  intervalMs: 1000,    // Poll every 1 second
  onProgress: undefined // Optional progress callback
};
```

To customize polling behavior, pass options to the transform methods:

```typescript
// Example with custom polling
const response = await ApiService.transform.webpage(
  { url, persona },
  {
    maxAttempts: 180,  // 3 minutes
    intervalMs: 1000,  // 1 second
    onProgress: (status) => {
      console.log(`Progress: ${status.progress}% - Stage: ${status.stage}`);
    }
  }
);
```

## Key Changes Summary

### Backend
1. **POST /api/transform** now returns 202 (Accepted) with a jobId for cache misses
2. **POST /api/transform/text** follows the same pattern
3. **GET /api/transform/jobs/:jobId** - New endpoint for polling job status
4. Jobs use distributed locking via Redis to prevent duplicate processing
5. Background jobs continue even if client disconnects (no request-scoped AbortSignal)

### Frontend
1. Transform methods now automatically poll for job completion
2. Progress updates available via `jobProgress` and `jobStage` in state
3. Cached results return immediately (200 status with data)
4. Deterministic job IDs allow resume on page refresh

## Testing the Implementation

1. **Test cache hit** (should return immediately):
   ```bash
   curl -X POST http://localhost:5000/api/transform \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com","persona":"professional"}'
   ```

2. **Test cache miss** (should return 202 with jobId):
   ```bash
   curl -X POST http://localhost:5000/api/transform \
     -H "Content-Type: application/json" \
     -d '{"url":"https://new-site.com","persona":"professional"}'
   ```

3. **Poll for job status**:
   ```bash
   curl http://localhost:5000/api/transform/jobs/{jobId}
   ```

## Migration Notes

- The API is **backward compatible** for cache hits (returns 200 with data)
- For cache misses, old clients expecting synchronous response will see 202
- The frontend automatically handles both patterns
- No database migrations required (uses existing Redis)
- Jobs expire automatically after JOB_TTL_SECONDS
