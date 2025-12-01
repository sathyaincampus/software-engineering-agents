locals {
  project_name = "sparktoship"
  environment    = "dev" # Or "staging", "prod"
  region         = "us-east-1" # Example AWS region
}

# Configure the AWS Provider
provider "aws" {
  region = local.region

  # Configure credentials using environment variables, shared credentials file, or IAM roles
  # Example using environment variables:
  # access_key = "YOUR_ACCESS_KEY"
  # secret_key = "YOUR_SECRET_KEY"
}

# --- Networking Setup ---

# Create a Virtual Private Cloud (VPC)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${local.project_name}-${local.environment}-vpc"
    Environment = local.environment
  }
}

# Create public subnets (e.g., for load balancers, bastion hosts)
resource "aws_subnet" "public" {
  count = 2 # Create 2 public subnets across different Availability Zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 1) # Example: 10.0.1.0/24, 10.0.2.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.project_name}-${local.environment}-public-subnet-${count.index + 1}"
    Environment = local.environment
  }
}

# Create private subnets (e.g., for application instances, databases)
resource "aws_subnet" "private" {
  count = 2 # Create 2 private subnets across different Availability Zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10) # Example: 10.0.11.0/24, 10.0.12.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${local.project_name}-${local.environment}-private-subnet-${count.index + 1}"
    Environment = local.environment
  }
}

# Internet Gateway for public subnets to access the internet
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${local.project_name}-${local.environment}-igw"
    Environment = local.environment
  }
}

# NAT Gateway for private subnets to access the internet (requires an Elastic IP)
resource "aws_eip" "nat" {
  count = length(aws_subnet.public) # One NAT Gateway per Availability Zone where private subnets exist
  vpc = true

  tags = {
    Name        = "${local.project_name}-${local.environment}-nat-eip-${count.index + 1}"
    Environment = local.environment
  }
}

resource "aws_nat_gateway" "nat" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${local.project_name}-${local.environment}-nat-gw-${count.index + 1}"
    Environment = local.environment
  }

  depends_on = [aws_internet_gateway.gw]
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-public-rtb"
    Environment = local.environment
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-private-rtb-${count.index + 1}"
    Environment = local.environment
  }
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "web_access" {
  name        = "${local.project_name}-${local.environment}-web-access"
  description = "Allow HTTP/HTTPS access from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-web-access-sg"
    Environment = local.environment
  }
}

resource "aws_security_group" "app_backend" {
  name        = "${local.project_name}-${local.environment}-app-backend"
  description = "Allow access for backend services"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8000 # Or your backend port
    to_port         = 8000
    protocol        = "tcp"
    # Allow traffic from the web security group (e.g., Load Balancer)
    security_groups = [aws_security_group.web_access.id]
    # Or allow traffic from specific private subnets if not using ALB/NLB
    # cidr_blocks     = ["10.0.10.0/24", "10.0.11.0/24"] # Example private CIDRs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-app-backend-sg"
    Environment = local.environment
  }
}

resource "aws_security_group" "db" {
  name        = "${local.project_name}-${local.environment}-db-sg"
  description = "Allow access to PostgreSQL from backend services"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    # Allow traffic from the backend security group
    security_groups = [aws_security_group.app_backend.id]
    # If using EC2 instances directly in private subnets without security group referencing:
    # cidr_blocks = ["10.0.10.0/24", "10.0.11.0/24"] # Example private CIDRs
  }

  # Egress rules are often less restrictive for DBs, but can be tightened if needed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-db-sg"
    Environment = local.environment
  }
}

resource "aws_security_group" "redis" {
  name        = "${local.project_name}-${local.environment}-redis-sg"
  description = "Allow access to Redis from backend services"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"
    # Allow traffic from the backend security group
    security_groups = [aws_security_group.app_backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.project_name}-${local.environment}-redis-sg"
    Environment = local.environment
  }
}

# --- Database Setup ---

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20 # GB
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro" # Choose instance class based on expected load
  db_name              = "sparktoship_db"
  username             = "postgres"
  password             = "your_db_password" # !! IMPORTANT: Use secrets management for production passwords !!
  parameter_group_name = "default:postgres15"
  skip_final_snapshot  = true # Set to false for production
  publicly_accessible  = false # Keep databases private
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.db.name

  tags = {
    Name        = "${local.project_name}-${local.environment}-postgres-db"
    Environment = local.environment
  }
}

resource "aws_db_subnet_group" "db" {
  name       = "${local.project_name}-${local.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id # Place DB in private subnets

  tags = {
    Name        = "${local.project_name}-${local.environment}-db-subnet-group"
    Environment = local.environment
  }
}

# --- Caching Setup ---

resource "aws_elasticache_cluster" "redis" {
  cluster_id                    = "${local.project_name}-${local.environment}-redis-cache"
  engine                        = "redis"
  node_type                     = "cache.t3.micro" # Choose node type based on expected load
  num_cache_nodes               = 1
  parameter_group_name          = "default.redis7"
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.redis.id]
  port                          = 6379
  engine_version                = "7.1"
  automatic_failover_enabled    = false # Set to true for production for HA
  multi_az_enabled              = false # Set to true for production for HA
  snapshot_window               = "02:00-03:00"
  snapshot_retention_limit      = 7
  # snapshot_create_cluster_on_destroy = true # Set to true for production

  tags = {
    Name        = "${local.project_name}-${local.environment}-redis-cache"
    Environment = local.environment
  }
}
esource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.project_name}-${local.environment}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id # Place Redis in private subnets

  tags = {
    Name        = "${local.project_name}-${local.environment}-redis-subnet-group"
    Environment = local.environment
  }
}

# --- Compute Setup (Example using EC2 Instances) ---
# Note: For containerized deployments, ECS or EKS would be more appropriate.
# This example uses EC2 for simplicity to demonstrate security group and subnet association.

resource "aws_instance" "backend_app" {
  count = 1 # Example: Deploying one instance for backend

  ami           = data.aws_ami.ubuntu.id # Find the latest Ubuntu AMI ID
  instance_type = "t3.micro" # Choose instance type
  subnet_id     = aws_subnet.private[0].id # Launch in a private subnet
  vpc_security_group_ids = [
    aws_security_group.app_backend.id
    # Add other security groups if needed, e.g., for SSH access (bastion host required)
  ]

  # Add key pair for SSH access (optional, manage securely)
  # key_name = "your-ssh-key-pair-name"

  # User data for bootstrapping (e.g., installing Docker, pulling images)
  # user_data = file("scripts/bootstrap.sh") 

  tags = {
    Name        = "${local.project_name}-${local.environment}-backend-app-${count.index + 1}"
    Environment = local.environment
  }

  # Ensure dependencies are created before launching instance
  depends_on = [
    aws_security_group.app_backend,
    aws_nat_gateway.nat,
    aws_db_instance.postgres,
    aws_elasticache_cluster.redis
  ]
}

# --- Data Sources ---

# Get the latest Ubuntu AMI ID (adjust the filter for your needs)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's owner ID for Ubuntu

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-2022*", "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-2022*"] # Example names for 20.04 and 22.04 LTS
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get available Availability Zones in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# --- Outputs ---

output "backend_instance_public_ips" {
  description = "Public IP addresses of the backend instances (if applicable)"
  value       = aws_instance.backend_app[*].public_ip
}

output "backend_instance_private_ips" {
  description = "Private IP addresses of the backend instances"
  value       = aws_instance.backend_app[*].private_ip
}

output "rds_postgres_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_postgres_port" {
  description = "The connection port for the PostgreSQL database"
  value       = aws_db_instance.postgres.port
}

output "redis_cache_endpoint" {
  description = "The connection endpoint for the Redis cache"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_cache_port" {
  description = "The connection port for the Redis cache"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}
