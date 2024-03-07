# it-ae-github-app-org-repo-settings

GitHub app for applying repo settings based on name matching.
Create a pull request in the [org-settings](https://github.com/tamu-edu/org-settings/tree/main) repo to add a new settings template.

The Terraform creates a Lambda function and other necessary infrastructure including the function URL, the IAM role for the function, and an S3 bucket to store the function code.
A Github app monitors for repository events and sends the webhooks to the Lambda function URL.
The Lambda function checks the Github payload for the event type. If the event is not a repository creation, the function returns a 200 response.
A file containing existing settings templates is retrieved from Github and checked for regex matches with the repository name. If a match is found, the settings template is applied to the repository settings.

## Setting up the Github app

The Github app is created using Github web interface. The app is installed on the organization and configured to listen for repository events. The app is also configured to use the Lambda function URL as the webhook URL.
