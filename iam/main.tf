terraform {
  backend "s3" {
    bucket         = "terraform-state-529455156359"
    key            = "iam/terraform.tfstate"
    dynamodb_table = "terraform-state-529455156359"
    region         = "us-east-2"
  }
}

module "github_oidc" {
  source = "github.com/tamu-edu/it-ae-tfmod-github-oidc?ref=v1.0.0"

  name     = "github-account-config"
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
