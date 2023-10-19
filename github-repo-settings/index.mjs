import { App } from "octokit";

export const handler = async (event, context) => {
  // console.log('Received event: ' + JSON.stringify(event, null, 2));

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

      const app = new App({
        appId,
        privateKey,
        webhooks: { secret: webhookSecret },
      });

      try {
        const requestString = `PUT /orgs/${data.organization.login}/teams/repo-settings-team/repos/${data.repository.full_name}}`;
        await octokit.request(requestString, {
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
