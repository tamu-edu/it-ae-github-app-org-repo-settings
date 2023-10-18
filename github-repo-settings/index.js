import {App} from "octokit";

module.exports.handler = async (event, context) => {
    const obj = JSON.parse(event.body);
    console.log('Received event: ' + obj);

    const githubEvent = event.headers['x-gitHub-event'];

    if (githubEvent === 'repository') {
        const data = event.body;
        const action = data.action;
        if (action === 'created') {
            console.log('A repository was created with this name: ' + data.name);
        }
    }
    
    const response = {
        statusCode: 200
    };
    return response;
};