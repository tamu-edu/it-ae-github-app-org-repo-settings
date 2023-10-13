module.exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const obj = JSON.parse(event.body);
    
    console.log('value1 =', obj.key1);
    console.log('value2 =', obj.key2);
    console.log('value3 =', obj.key3);
    return obj.key1;
};