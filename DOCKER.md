# 🐳 Docker Quick Start Guide

## Prerequisites
- Docker Desktop installed
- Docker Compose v2.0+

## Quick Launch (Development)

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **Update .env with your credentials:**
   - OpenAI API key
   - Auth0 credentials
   - Strong passwords for MongoDB/Redis

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## Production Deployment

1. **Build for production:**
   ```bash
   docker-compose --profile production up -d
   ```

2. **With SSL (requires certificates in nginx/ssl/):**
   ```bash
   # Add your SSL certificates to nginx/ssl/
   docker-compose --profile production up -d
   ```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Remove all data (⚠️ destructive)
docker-compose down -v
```

## Service Health Checks

All services include health checks:
- `docker-compose ps` shows health status
- Services auto-restart on failure
- Health endpoints available for monitoring

## Scaling

```bash
# Scale server instances
docker-compose up -d --scale server=3

# Add load balancer for multiple instances
# (requires nginx configuration updates)
```
