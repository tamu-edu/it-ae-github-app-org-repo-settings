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
}

provider "aws" {
  region = "us-east-2"
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = var.lambda_bucket_name
}

data "archive_file" "lambda_github_app" {
  type        = "zip"
  source_dir  = "${path.module}/github-repo-settings"
  output_path = "${path.module}/github-repo-settings.zip"
}

resource "aws_s3_object" "lambda_github_app" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "github-repo-settings.zip"
  source = data.archive_file.lambda_github_app.output_path

  etag = filemd5(data.archive_file.lambda_github_app.output_path)
}

resource "aws_lambda_function" "github_repo_settings" {
  function_name = "github-repo-settings"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_github_app.key

  runtime = "nodejs18.x"
  handler = "index.handler"

  source_code_hash = data.archive_file.lambda_github_app.output_base64sha256

  role = aws_iam_role.iam_for_lambda.arn
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
  name               = "iam_for_lambda"
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
