output "function_url" {
  description = "URL of the Lambda function"
  value       = aws_lambda_function_url.test_latest.function_url
}
