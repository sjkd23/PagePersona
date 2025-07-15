# Redis for PagePersonAI Testing

## Start Redis with Docker

```bash
# Start Redis server
docker run -d -p 6379:6379 --name pagepersonai-redis redis:latest

# Stop Redis server
docker stop pagepersonai-redis

# Remove Redis container
docker rm pagepersonai-redis
```

## Test Redis Connection

```bash
# Test Redis caching
npm run test:redis
```

## Redis CLI Commands

```bash
# Connect to Redis CLI
docker exec -it pagepersonai-redis redis-cli

# Check all keys
KEYS *

# Check specific transform keys
KEYS transform:*

# Get a specific key
GET transform:persona:base64url

# Clear all keys
FLUSHALL
```
