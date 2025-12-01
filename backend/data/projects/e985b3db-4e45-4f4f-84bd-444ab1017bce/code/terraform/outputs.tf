# Define output values for the Terraform configuration

output "vpc_id" {
  description = "The ID of the VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of IDs for the public subnets."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs for the private subnets."
  value       = aws_subnet.private[*].id
}

output "rds_postgres_endpoint" {
  description = "The connection endpoint for the PostgreSQL database."
  value       = aws_db_instance.postgres.endpoint
}

output "rds_postgres_port" {
  description = "The connection port for the PostgreSQL database."
  value       = aws_db_instance.postgres.port
}

output "rds_postgres_db_name" {
  description = "The name of the PostgreSQL database."
  value       = aws_db_instance.postgres.db_name
}

output "rds_postgres_user" {
  description = "The username for the PostgreSQL database."
  value       = aws_db_instance.postgres.username
}

output "redis_cache_endpoint" {
  description = "The connection endpoint for the Redis cache."
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_cache_port" {
  description = "The connection port for the Redis cache."
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}

output "backend_instance_ids" {
  description = "List of IDs for the backend EC2 instances."
  value       = aws_instance.backend_app[*].id
}

output "backend_instance_private_ips" {
  description = "List of private IP addresses of the backend EC2 instances."
  value       = aws_instance.backend_app[*].private_ip
}

# Add output for Load Balancer DNS name if you implement one (e.g., ALB/NLB)
# output "load_balancer_dns_name" {
#   description = "The DNS name of the Application Load Balancer."
#   value       = aws_lb.main.dns_name
# }
