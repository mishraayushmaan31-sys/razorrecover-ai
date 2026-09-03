output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "Application Load Balancer DNS name"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.cdn.domain_name
  description = "CloudFront distribution endpoint"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS PostgreSQL endpoint"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  description = "ElastiCache Redis primary endpoint"
}

output "sqs_webhook_queue_url" {
  value       = aws_sqs_queue.webhook_queue.id
  description = "SQS Webhook queue URL"
}

output "s3_audit_bucket_name" {
  value       = aws_s3_bucket.audit_archive.id
  description = "S3 audit archive bucket name"
}

