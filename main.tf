terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "gh-app-org-repo-settings"
    key            = "terraform-state/gh-app-org-repo-settings.tfstate"
    dynamodb_table = "gh-app-org-repo-settings"
    region         = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket        = var.lambda_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id
  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_public_access_block" "lambda_bucket" {
  bucket                  = aws_s3_bucket.lambda_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "example" {
  bucket = aws_s3_bucket.lambda_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

data "archive_file" "lambda_github_app" {
  type        = "zip"
  source_dir  = "${path.module}/${var.lambda_function_name}"
  output_path = "${path.module}/${var.lambda_function_name}.zip"
}

resource "aws_s3_object" "lambda_github_app" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "${var.lambda_function_name}.zip"
  source = data.archive_file.lambda_github_app.output_path

  etag = filemd5(data.archive_file.lambda_github_app.output_path)
}

resource "aws_lambda_function" "github_repo_settings" {
  function_name = var.lambda_function_name

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_github_app.key

  runtime = "nodejs18.x"
  handler = "index.handler"

  source_code_hash = data.archive_file.lambda_github_app.output_base64sha256

  role = aws_iam_role.iam_for_lambda.arn

  timeout = "60"
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = var.lambda_iam_role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_lambda_function_url" "test_latest" {
  function_name      = aws_lambda_function.github_repo_settings.function_name
  authorization_type = "NONE"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "secretsmanager" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "secretsmanager" {
  policy = data.aws_iam_policy_document.secretsmanager.json
}

resource "aws_iam_role_policy_attachment" "secretsmanager" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.secretsmanager.arn
}

resource "aws_secretsmanager_secret" "github_app_private_key" {
  name = "github-repo-settings/PRIVATE_KEY"
}

resource "aws_secretsmanager_secret" "github_app_app_id" {
  name = "github-repo-settings/APP_ID"
}

resource "aws_secretsmanager_secret" "github_app_webhook_secret" {
  name = "github-repo-settings/WEBHOOK_SECRET"
}

resource "aws_secretsmanager_secret_version" "github_app_private_key" {
  secret_id     = aws_secretsmanager_secret.github_app_private_key.id
  secret_string = var.github_app_private_key
}

resource "aws_secretsmanager_secret_version" "github_app_app_id" {
  secret_id     = aws_secretsmanager_secret.github_app_app_id.id
  secret_string = var.github_app_app_id
}

resource "aws_secretsmanager_secret_version" "github_app_webhook_secret" {
  secret_id     = aws_secretsmanager_secret.github_app_webhook_secret.id
  secret_string = var.github_app_webhook_secret
}

