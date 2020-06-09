/*
 * This is taken from the Splunk Logging for AWS Lambda - This is pre-built in AWS Lambda Blueprints
 * There are minor modifications so that just the event information from the Fugue event 
 * is sent to Splunk.
 * 
 * This function logs to a Splunk host using Splunk's HTTP event collector API.
 
 * Define the following Environment Variables in the console below to configure
    * this function to log to your Splunk host:
 *
 * 1. SPLUNK_HEC_URL: URL address for your Splunk HTTP event collector endpoint.
 * Default port for event collector is 8088. Example: https://host.com:8088/services/collector
 *
 * 2. SPLUNK_HEC_TOKEN: Token for your Splunk HTTP event collector.
 * To create a new token for this Lambda function, refer to Splunk Docs:
 * http://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector#Create_an_Event_Collector_token

 * Also note the other portion of this function includes a .lib folder with a another file
 * called mysplunklogger which is referenced.  No modifications are needed for that file. 
 */
const loggerConfig = {
    url: process.env.SPLUNK_HEC_URL,
    token: process.env.SPLUNK_HEC_TOKEN,
};

const SplunkLogger = require('./lib/mysplunklogger');

const logger = new SplunkLogger(loggerConfig);



exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    console.log(JSON.stringify(event, null, 2));
    console.log('From SNS:', event.Records[0].Sns.Message);

    // Log JSON objects to Splunk

    logger.log(event);

    

    // Send all the events in a single batch to Splunk
    logger.flushAsync((error, response) => {
        if (error) {
            callback(error);
        } else {
            console.log(`Response from Splunk:\n${response}`);
            callback(null, event.key1); // Echo back the first key value
        }
    });
};
