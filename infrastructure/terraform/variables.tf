variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources into"
  default     = "ap-south-1" # Mumbai region for Razorpay & Indian banking compliance
}

variable "environment" {
  type        = string
  description = "Deployment environment (staging, production)"
  default     = "production"
}

variable "app_name" {
  type        = string
  description = "Name of the application"
  default     = "razorrecover"
}

variable "domain_name" {
  type        = string
  description = "Domain name for Route 53 and CloudFront"
  default     = "app.razorrecover.com"
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class sized for MVP"
  default     = "db.t4g.medium"
}

variable "redis_node_type" {
  type        = string
  description = "ElastiCache node type"
  default     = "cache.t4g.small"
}

variable "ecs_task_cpu" {
  type        = number
  description = "Fargate task CPU units"
  default     = 512 # 0.5 vCPU
}

variable "ecs_task_memory" {
  type        = number
  description = "Fargate task Memory in MB"
  default     = 1024 # 1 GB
}

variable "min_capacity" {
  type        = number
  description = "Minimum Fargate tasks running"
  default     = 2
}

variable "max_capacity" {
  type        = number
  description = "Maximum Fargate tasks for autoscaling"
  default     = 6
}

