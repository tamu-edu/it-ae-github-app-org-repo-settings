module.exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const obj = JSON.parse(event.body);
    console.log(obj)

    const response = {
        statusCode: 200,
        body: JSON.stringify('Repository ' + obj.action)
    };

    return response;
};