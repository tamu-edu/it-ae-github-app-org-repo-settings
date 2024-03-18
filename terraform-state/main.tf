module "state_backend" {
	source = "github.com/tamu-edu/it-ae-tfmod-aws-state?ref=v0.0.2"
	bucket_name = "gh-app-org-repo-settings"
	dynamodb_table_name = "gh-app-org-repo-settings"
}

output "region" {
	value = module.state_backend.region
}

output "account_id" {
	value = module.state_backend.account_id
}

output "bucket" {
	value = module.state_backend.bucket
}

output "dynamodb_table" {
	value = module.state_backend.dynamodb_table
}
