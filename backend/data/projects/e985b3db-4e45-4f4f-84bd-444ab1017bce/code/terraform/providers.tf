# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  # It's recommended to configure AWS credentials through environment variables,
  # the shared credentials file (~/.aws/credentials), or an IAM role attached
  # to the EC2 instance/ECS task running Terraform.
  # Explicitly setting access_key and secret_key here is discouraged for security reasons.
  # access_key = "YOUR_ACCESS_KEY"
  # secret_key = "YOUR_SECRET_KEY"
}

# Configure Terraform backend (optional but recommended for collaboration and state management)
# Example using S3 backend:
# terraform {
#   backend "s3" {
#     bucket = "your-terraform-state-bucket-name"
#     key    = "sparktoship/dev/terraform.tfstate"
#     region = "us-east-1"
#     dynamodb_table = "your-terraform-state-lock-table"
#   }
# }

# Define required providers and their versions
terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Add other providers if needed (e.g., random, null)
    # random = {
    #   source = "hashicorp/random"
    #   version = "~> 3.0"
    # }
  }
}
