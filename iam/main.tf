terraform {
  backend "s3" {
    bucket         = "gh-app-org-repo-settings"
    key            = "iam/terraform.tfstate"
    dynamodb_table = "gh-app-org-repo-settings"
    region         = "us-east-1"
  }
}

module "github_oidc" {
  source = "github.com/tamu-edu/it-ae-tfmod-github-oidc?ref=v1.0.0"

  name     = "github-app-org-repo-settings-iam-role"
  subjects = ["repo:tamu-edu/it-ae-github-app-org-repo-settings:*"]
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AdministratorAccess"
  ]
  inline_policies = {
    "S3Access" = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Action" : "s3:*",
          "Resource" : "*"
        }
      ]
    })
  }
}

output "github_oidc" {
  value = module.github_oidc.role_arn
}
