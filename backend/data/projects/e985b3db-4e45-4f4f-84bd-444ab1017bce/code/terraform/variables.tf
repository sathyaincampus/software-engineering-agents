# Define input variables for Terraform configuration

variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The name of the project, used for tagging resources."
  type        = string
  default     = "sparktoship"
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "instance_type_backend" {
  description = "The EC2 instance type for the backend application."
  type        = string
  default     = "t3.micro"
}

variable "instance_type_cache" {
  description = "The ElastiCache node type for Redis."
  type        = string
  default     = "cache.t3.micro"
}

variable "db_instance_class" {
  description = "The RDS instance class for the PostgreSQL database."
  type        = string
  default     = "db.t3.micro"
}

variable "db_storage_gb" {
  description = "The allocated storage in GB for the PostgreSQL database."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "The name of the PostgreSQL database."
  type        = string
  default     = "sparktoship_db"
}

variable "db_user" {
  description = "The username for the PostgreSQL database."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "The password for the PostgreSQL database. WARNING: Manage securely, especially in production."
  type        = string
  sensitive   = true # Mark as sensitive to prevent accidental logging
  # In production, use environment variables, Vault, or AWS Secrets Manager instead of hardcoding.
  default     = "your_db_password_change_me"
}

variable "redis_port" {
  description = "The port for the Redis cache."
  type        = number
  default     = 6379
}

variable "postgres_port" {
  description = "The port for the PostgreSQL database."
  type        = number
  default     = 5432
}

variable "backend_port" {
  description = "The port the backend application listens on."
  type        = number
  default     = 8000
}

variable "vpc_cidr_block" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "number_of_subnets" {
  description = "The number of public and private subnets to create per AZ."
  type        = number
  default     = 2 # Creates 2 public and 2 private subnets per AZ
}

variable "ssh_key_name" {
  description = "The name of the EC2 key pair to use for SSH access (optional)."
  type        = string
  default     = null # Set to your key pair name if needed
}

variable "ami_ubuntu_filter_values" {
  description = "List of Ubuntu AMI names to filter for."
  type        = list(string)
  default = [
    "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-2022*",
    "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-2022*"
  ]
}
