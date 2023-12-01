import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { App } from "octokit";
// import regexTemplates from "./repo_settings.json";

export const handler = async (event) => {
  try {
    console.log(event);

    const githubEvent = event.headers["x-github-event"];
    if (githubEvent === "repository") {
      const data = JSON.parse(event.body);
      console.log("GitHub payload: " + JSON.stringify(data, null, 2));

      if (data.action === "created") {
        console.log(
          "A repository was created with this name: " + data.repository.name
        );

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
        console.log("Authenticated with octokit " + data.installation.id);
        /////////////////////////////////////////////////

        // Retrieve the template file from Github
        const regexTemplates = await retrieveTemplate(
          octokit,
          data.organization.login,
          "org-settings",
          "repo_settings/repo_settings.json"
        );
        console.log("regexTemplates: " + JSON.stringify(regexTemplates));
        /////////////////////////////////////////////////

        // Parse the template file for matches
        let repoTemplate = null;
        let grantAccessTeams = null;
        console.log(
          "regexTemplates: " + JSON.stringify(regexTemplates, null, 2)
        );
        for (var regexString in regexTemplates) {
          const regex = new RegExp(regexString);
          console.log("regex: " + regex);
          if (regex.test(data.repository.name)) {
            grantAccessTeams = regexTemplates[regexString].access;
            repoTemplate = regexTemplates[regexString];
            console.log(
              "grantAccessTeams: " + JSON.stringify(grantAccessTeams)
            );
            break;
          }
        }

        if (repoTemplate === null) {
          console.log("There is no template for the named repo");
          return {
            statusCode: 200,
            body: JSON.stringify({
              message:
                "This repository name does not have a template: " +
                data.repository.name,
            }),
          };
        } else {
          console.log("A template exists for this repo name");
        }
        /////////////////////////////////////////////////

        // Add the teams to the repo
        await updateTeamPermissions(
          octokit,
          data.organization,
          data.repository,
          grantAccessTeams
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            message:
              "Updated team permissions for repository: " +
              data.repository.name,
          }),
        };
      }
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Received an event that is not a repository creation: " +
            githubEvent,
        }),
      };
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
  try {
    const route = "GET /repos/{owner}/{repo}/contents/{path}";
    const response = await octokit.request(route, {
      owner: owner,
      repo: repo,
      path: path,
    });
    console.log("response: " + JSON.stringify(response, null, 2));
    return response.content;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  try {
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
  } catch (error) {
    console.error(error);
    throw error;
  }
};
