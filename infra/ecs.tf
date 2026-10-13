# ECR Repository for Pipeline Container Image
resource "aws_ecr_repository" "app_repo" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 30
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"
}

# ECS Task Definition (Runs FastAPI or SQS Worker depending on CMD/MODE env)
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project_name}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${aws_ecr_repository.app_repo.repository_url}:latest"
      essential = true
      environment = [
        { name = "ENVIRONMENT", value = var.environment },
        { name = "AWS_DEFAULT_REGION", value = var.aws_region },
        { name = "S3_CONTRACTS_BUCKET", value = aws_s3_bucket.contracts.bucket },
        { name = "S3_RESULTS_BUCKET", value = aws_s3_bucket.results.bucket },
        { name = "SQS_QUEUE_URL", value = aws_sqs_queue.contracts_queue.url },
        { name = "BEDROCK_MODEL_ID", value = var.bedrock_model_id }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    }
  ])
}
