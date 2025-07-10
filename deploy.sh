# Production deployment scripts
DEPLOY_DIR=/opt/pagepersonai
DOCKER_COMPOSE_FILE=docker-compose.yml

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    echo_info "Docker is running ✓"
}

# Check if environment file exists
check_env() {
    if [ ! -f .env ]; then
        echo_warning ".env file not found. Creating from template..."
        cp .env.docker .env
        echo_error "Please update .env with your production credentials before continuing."
        exit 1
    fi
    echo_info "Environment file found ✓"
}

# Deploy function
deploy() {
    echo_info "Starting PagePersonAI deployment..."
    
    check_docker
    check_env
    
    echo_info "Pulling latest images..."
    docker-compose pull
    
    echo_info "Building services..."
    docker-compose build --no-cache
    
    echo_info "Starting services..."
    docker-compose up -d
    
    echo_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if docker-compose ps | grep -q "unhealthy"; then
        echo_error "Some services are unhealthy. Check logs with: docker-compose logs"
        exit 1
    fi
    
    echo_info "Deployment completed successfully! 🎉"
    echo_info "Frontend: http://localhost"
    echo_info "Backend: http://localhost:5000"
    echo_info "Check status: docker-compose ps"
}

# Rollback function
rollback() {
    echo_warning "Rolling back to previous version..."
    docker-compose down
    # Add logic to restore previous images if needed
    echo_info "Rollback completed"
}

# Usage
case "$1" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    *)
        echo "Usage: $0 {deploy|rollback}"
        exit 1
        ;;
esac
