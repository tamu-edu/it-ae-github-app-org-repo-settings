variable "aws_region" {
  description = "value of the AWS region"

  default = "us-east-2"
}

variable "lambda_bucket_name" {
  description = "name of the S3 bucket to store lambda code"

  default = "gh-app-lamba-code-bucket"
}

variable "lambda_function_name" {
  description = "name of the lambda function"

  default = "gh-app-org-repo-settings"
}

variable "lambda_iam_role_name" {
  description = "value of the IAM role name for the lambda function"

  default = "gh-app-org-repo-settings-iam-role"
}

variable "github_app_private_key" {
  type        = string
  description = "Private key for the github app"
  sensitive   = true
}

variable "github_app_app_id" {
  type        = string
  description = "App ID for the github app"
}

variable "github_app_webhook_secret" {
  type        = string
  description = "Webhook secret for the github event webhook"
  sensitive   = true
}
