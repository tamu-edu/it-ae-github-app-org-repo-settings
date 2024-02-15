variable "aws_region" {
  description = "value of the AWS region"

  default = "us-east-2"
}

variable "lambda_bucket_name" {
  description = "name of the S3 bucket to store lambda code"

  default = "gh-app-org-repo-settings-bucket"
}

variable "lambda_function_name" {
  description = "name of the lambda function"

  default = "gh-app-org-repo-settings"
}

variable "lambda_iam_role_name" {
  description = "value of the IAM role name for the lambda function"

  default = "gh-app-org-repo-settings-iam-role"
}
