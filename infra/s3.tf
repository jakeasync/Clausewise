resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket for Raw Contracts
resource "aws_s3_bucket" "contracts" {
  bucket        = "${var.project_name}-contracts-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "contracts" {
  bucket = aws_s3_bucket.contracts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "contracts" {
  bucket = aws_s3_bucket.contracts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "contracts" {
  bucket                  = aws_s3_bucket.contracts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Structured Extraction JSON Results
resource "aws_s3_bucket" "results" {
  bucket        = "${var.project_name}-results-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "results" {
  bucket = aws_s3_bucket.results.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "results" {
  bucket                  = aws_s3_bucket.results.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
