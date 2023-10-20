import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

export const handler = async (event, context) => {
  // console.log('Received event: ' + JSON.stringify(event, null, 2));
  // const { Octokit } = require("@octokit/core");
  // const { createAppAuth } = require("@octokit/auth-app");

  const githubEvent = event.headers["x-github-event"];
  if (githubEvent === "repository") {
    const data = JSON.parse(event.body);
    console.log("GitHub payload: " + JSON.stringify(data, null, 2));

    const action = data.action;
    if (action === "created") {
      console.log(
        "A repository was created with this name: " + data.repository.name
      );

      const appId = process.env.APP_ID;
      const webhookSecret = process.env.WEBHOOK_SECRET;
      const privateKey = process.env.PRIVATE_KEY;

      // console.log("App ID: " + appId);
      // console.log("Webhook Secret: " + webhookSecret);
      // console.log("Private Key: " + privateKey);

      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: appId,
          privateKey: privateKey,
          clientId: "Iv1.1389af67aba6167e",
          clientSecret: "7d552329c5e4eeb37326c993c69a913622a43daf",
          installationId: 123,
        },
      });

      try {
        const requestString = `PUT /orgs/${data.organization.login}/teams/repo-settings-team/repos/${data.repository.full_name}}`;
        // await octokit.request(requestString, {
        //   org: data.organization.login,
        //   team_slug: "repo-settings-team",
        //   owner: data.organization.login,
        //   repo: data.repository.name,
        //   permission: "admin",
        //   headers: {
        //     "X-GitHub-Api-Version": "2022-11-28",
        //   },
        // });
        const { slug } = await appOctokit.request(requestString, {
          org: data.organization.login,
          team_slug: "repo-settings-team",
          owner: data.organization.login,
          repo: data.repository.name,
          permission: "admin",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
      } catch (error) {
        if (error.response) {
          console.error(
            `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
          );
        }
        console.error(error);
      }
    }
  } else {
    console.log(
      "Received an event that is not a repository event: " + githubEvent
    );
  }

  const response = {
    statusCode: 200,
  };
  return response;
};
