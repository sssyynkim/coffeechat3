# AWS provider configuration
# This sets up the provider to use the specified AWS region from the variables file
provider "aws" {
  region = var.aws_region  # Use the AWS region variable
}

# Reference the existing S3 bucket using the data block
data "aws_s3_bucket" "existing_bucket" {
  bucket = var.s3_bucket_name  # Reference the existing S3 bucket using the variable
}