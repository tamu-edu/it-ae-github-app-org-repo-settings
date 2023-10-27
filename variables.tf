variable "aws_region" {
  description = "value of the AWS region"

  default = "us-east-2"
}

variable "lambda_bucket_name" {
  description = "name of the S3 bucket to store lambda code"

  default = "lambda-github-repo-settings-bucket"
}
