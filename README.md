# it-ae-github-app-org-repo-settings

GitHub app for applying repo settings based on name matching.

The Terraform creates a Lambda function and other necessary infrastructure including the function URL, the IAM role for the function, and an S3 bucket to store the function code.

A Github app monitors for repository events and sends the webhooks to the Lambda function URL.
The Lambda function checks the Github payload for the event type. If the event is not a repository creation, the function returns a 200 response.
The template file is retrieved from Github and checked for regex matches with the repository name. If a match is found, the template is applied to the repository settings, otherwise the function returns.
