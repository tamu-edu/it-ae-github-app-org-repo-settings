import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { App } from "octokit";

export const handler = async (event) => {
  try {
    console.log(event);

    const githubEvent = event.headers["x-github-event"];
    if (githubEvent === "repository") {
      const data = JSON.parse(event.body);
      if (data.action === "created") {
        // Retrieve the secrets from AWS Secrets Manager
        const client = new SecretsManagerClient({
          region: "us-east-2",
        });
        let response;

        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/PRIVATE_KEY",
            VersionStage: "AWSCURRENT",
          })
        );
        const privateKey = response.SecretString;
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/APP_ID",
            VersionStage: "AWSCURRENT",
          })
        );
        const appId = response.SecretString;
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/WEBHOOK_SECRET",
            VersionStage: "AWSCURRENT",
          })
        );
        const webhookSecret = response.SecretString;
        /////////////////////////////////////////////////

        // Authenticate with Github
        const appOctokit = new App({
          appId: appId,
          privateKey: privateKey,
          webhooks: {
            secret: webhookSecret,
          },
        });
        const octokit = await appOctokit.getInstallationOctokit(
          data.installation.id
        );
        /////////////////////////////////////////////////

        // Retrieve the template file from Github
        const regexTemplates = await retrieveTemplate(
          octokit,
          data.organization.login,
          "org-settings",
          "repo_settings/repo_settings.json"
        );
        /////////////////////////////////////////////////

        // Parse the template file for matches
        let repoTemplate = null;
        for (var regexString in regexTemplates) {
          const regex = new RegExp(regexString);
          if (regex.test(data.repository.name)) {
            // match found
            repoTemplate = regexTemplates[regexString];
            break;
          }
        }
        /////////////////////////////////////////////////

        // Add the teams to the repo
        if (repoTemplate) {
          await updateTeamPermissions(
            octokit,
            data.organization,
            data.repository,
            repoTemplate.access
          );
          console.log("A template exists for this repo name");

          return {
            statusCode: 201,
          };
        }
      }
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const retrieveTemplate = async (octokit, owner, repo, path) => {
  const route = "GET /repos/{owner}/{repo}/contents/{path}";
  const response = await octokit.request(route, {
    owner: owner,
    repo: repo,
    path: path,
  });
  return JSON.parse(atob(response.data.content));
};

const retrieveTeamId = async (octokit, org, teamSlug) => {
  const route = "GET /orgs/{org}/teams/{team_slug}";
  const response = await octokit.request(route, {
    org: org,
    team_slug: teamSlug,
  });
  return response.data.id;
};

const updateTeamPermissions = async (octokit, org, repo, grantAccessTeams) => {
  for (var i = 0; i < grantAccessTeams.length; i++) {
    const teamId = await retrieveTeamId(
      octokit,
      org.login,
      grantAccessTeams[i].teamSlug
    );

    const route =
      "PUT /organizations/{org_id}/team/{team_id}/repos/{owner}/{repo}";
    await octokit.request(route, {
      org_id: org.id,
      team_id: teamId,
      owner: org.login,
      repo: repo.name,
      permission: grantAccessTeams[i].permission,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }
};
