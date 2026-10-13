output "contracts_s3_bucket" {
  description = "S3 bucket for uploaded contracts"
  value       = aws_s3_bucket.contracts.bucket
}

output "results_s3_bucket" {
  description = "S3 bucket for extracted results JSON"
  value       = aws_s3_bucket.results.bucket
}

output "sqs_queue_url" {
  description = "SQS queue URL for extraction processing tasks"
  value       = aws_sqs_queue.contracts_queue.url
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing container images"
  value       = aws_ecr_repository.app_repo.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}
