# it-ae-github-app-org-repo-settings

GitHub app for applying repo settings based on name matching

The Terraform creates a Lambda function and other necessary infrastructure including the function URL, the IAM role for the function, and an S3 bucket to store the function code.

The Lambda function receives webhook events from a Github app.
Lambda function URLs converts the Github payload JSON to a string in the body of a JSON object.
https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html#urls-payloads

The Github payload is checked for the event type.
https://docs.github.com/en/webhooks/webhook-events-and-payloads#create

The function retrieves secrets from AWS Secrets Manager to auhenticate to the Github REST API as a Github app installation through octokit.
https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation#using-octokitjs-to-authenticate-with-an-installation-id

A team is added to the newly created repo using a team id.
https://docs.github.com/en/rest/teams/teams?apiVersion=2022-11-28#add-or-update-team-repository-permissions
