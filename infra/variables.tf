variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project prefix for resource naming"
  type        = string
  default     = "clauselens"
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID for Claude"
  type        = string
  default     = "anthropic.claude-3-5-sonnet-20241022-v2:0"
}

variable "ecs_cpu" {
  description = "CPU units for ECS Fargate task (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory for ECS Fargate task in MB"
  type        = number
  default     = 1024
}
