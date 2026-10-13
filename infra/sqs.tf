# Dead Letter Queue (DLQ)
resource "aws_sqs_queue" "contracts_dlq" {
  name                      = "${var.project_name}-contracts-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days
}

# Main Contract Processing SQS Queue
resource "aws_sqs_queue" "contracts_queue" {
  name                       = "${var.project_name}-contracts-queue-${var.environment}"
  visibility_timeout_seconds = 360 # 6 minutes for OCR + Claude inference
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.contracts_dlq.arn
    maxReceiveCount     = 3
  })
}
