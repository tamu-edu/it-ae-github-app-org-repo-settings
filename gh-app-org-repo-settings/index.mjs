import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { App } from "octokit";

export const handler = async (event) => {
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
      let privateKey;
      let appId;
      let webhookSecret;

      try {
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/PRIVATE_KEY",
            VersionStage: "AWSCURRENT",
          })
        );
        privateKey = response.SecretString;
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/APP_ID",
            VersionStage: "AWSCURRENT",
          })
        );
        appId = response.SecretString;
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/WEBHOOK_SECRET",
            VersionStage: "AWSCURRENT",
          })
        );
        webhookSecret = response.SecretString;
      } catch (error) {
        throw error;
      }
      /////////////////////////////////////////////////

      const appOctokit = new App({
        appId: appId,
        privateKey: privateKey,
        webhooks: {
          secret: webhookSecret,
        },
      });

      try {
        const octokit = await appOctokit.getInstallationOctokit(
          data.installation.id
        );
        console.log("Authenticated with octokit " + data.installation.id);

        // const teamId = await retrieveTeamId(
        //   octokit,
        //   data.organization.login,
        //   "repo-settings-team"
        // );
        const route =
          "PUT /organizations/{org_id}/team/{team_id}/repos/{owner}/{repo}";
        await octokit.request(route, {
          org_id: data.organization.id,
          team_id: 8808531,
          owner: data.organization.login,
          repo: data.repository.name,
          permission: "maintain",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
      } catch (error) {
        if (error.response) {
          console.error(
            `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
          );
          console.error(error);
        }
        throw error;
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Updated team permissions for repository: " + data.repository.name,
        }),
      };
    }
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "Received an event that is not a repository event: " + githubEvent,
      }),
    };
  }

  return {
    statusCode: 200,
  };
};

// const retrieveTeamId = async (octokit, org, teamSlug) => {
//   const route = "GET /orgs/{org}/teams/{team_slug}";
//   const response = await octokit.request(route, {
//     org: org,
//     team_slug: teamSlug,
//   });
//   return response.data.id;
// };
