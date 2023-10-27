import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { App } from "octokit";

export const handler = async (event, context) => {
  const githubEvent = event.headers["x-github-event"];
  console.log(event);
  if (githubEvent === "repository") {
    const data = JSON.parse(event.body);
    console.log("GitHub payload: " + JSON.stringify(data, null, 2));

    const action = data.action;
    if (action === "created") {
      console.log(
        "A repository was created with this name: " + data.repository.name
      );

      // Retrieve the private key from AWS Secrets Manager
      const client = new SecretsManagerClient({
        region: "us-east-2",
      });
      let response;
      let privateKey;
      let appId;
      let webhookSecret;
      let clientId;
      let clientSecret;
      // const secret_name = "test/github-repo-settings/PRIVATE_KEY";

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
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/CLIENT_ID",
            VersionStage: "AWSCURRENT",
          })
        );
        clientId = response.SecretString;
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: "test/github-repo-settings/CLIENT_SECRET",
            VersionStage: "AWSCURRENT",
          })
        );
        clientSecret = response.SecretString;
      } catch (error) {
        throw error;
      }
      // const privateKey = response.SecretString;

      // secret_name = "test/github-repo-settings/PRIVATE_KEY";
      // try {
      //   response = await client.send(
      //     new GetSecretValueCommand({
      //       SecretId: secret_name,
      //       VersionStage: "AWSCURRENT",
      //     })
      //   );
      // } catch (error) {
      //   throw error;
      // }
      // const appId = response.SecretString;
      /////////////////////////////////////////////////

      // const appOctokit = new Octokit({
      //   authStrategy: createAppAuth,
      //   auth: {
      //     appId: appId,
      //     privateKey: privateKey,
      //     clientId: clientId,
      //     clientSecret: clientSecret,
      //     installationId: 43330184,
      //   },
      // });
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
        // await octokit.request("");

        await octokit.request(
          "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
          {
            org: data.organization.login,
            team_slug: "repo-settings-team",
            owner: data.organization.login,
            repo: data.repository.name,
            permission: "maintain",
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        );
      } catch (error) {
        if (error.response) {
          console.error(
            `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
          );
          console.error(error);
        }
        throw error;
      }
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
