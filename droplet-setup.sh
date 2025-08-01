#!/bin/bash

# DigitalOcean Droplet Setup Script for GeoGift Backend
# Run this script on your fresh Ubuntu droplet

echo "🚀 GeoGift Backend Droplet Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting server setup..."

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# Install essential packages
print_info "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_status "Essential packages installed"

# Install Python 3.11+
print_info "Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
print_status "Python 3.11 installed"

# Install Node.js 18 LTS
print_info "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
print_status "Node.js $(node --version) installed"

# Install PM2 globally
print_info "Installing PM2 process manager..."
npm install -g pm2
print_status "PM2 installed"

# Install Nginx
print_info "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_status "Nginx installed and started"

# Install Docker (for Redis if needed)
print_info "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io
systemctl enable docker
systemctl start docker
print_status "Docker installed"

# Install Docker Compose
print_info "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
print_status "Docker Compose installed"

# Configure firewall
print_info "Configuring firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 8000/tcp  # Backend API
ufw allow 3001/tcp  # Relay service
ufw --force enable
print_status "Firewall configured"

# Create application user
print_info "Creating application user..."
useradd -m -s /bin/bash geogift
usermod -aG docker geogift
print_status "User 'geogift' created"

# Create application directory
print_info "Creating application directory..."
mkdir -p /var/www/geogift
chown geogift:geogift /var/www/geogift
print_status "Application directory created"

# Install Certbot for SSL
print_info "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx
print_status "Certbot installed"

print_status "🎉 Server setup completed!"
print_info "Next steps:"
print_info "1. Clone your repository to /var/www/geogift"
print_info "2. Set up Python virtual environment"
print_info "3. Install application dependencies"
print_info "4. Configure PM2 processes"
print_info "5. Set up Nginx reverse proxy"

print_info "Server is ready for application deployment!"