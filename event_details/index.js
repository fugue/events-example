/* Go to your Fugue Tenant Dashboard and create an API Client.  Note your CLIENT_ID and your CLIENT_SECRET
   at the bottom of this screen, input those values as Environment Variables.

   This function will extract the details of your Fugue Event (Compliance, Drift, Remediation) and
   log them to any 3rd party tool that you may be using to generate reports.  The message is set as 
   variable called "body".  This will be your output parameter to be sent to any 3rd party tool. 
*/

exports.handler = function (event, context) {
    const eventDetail = require("./detail");
    const newUrl = event.Records[0].Sns.Message.api_url;

    // The json output of the called function below can be logged anywhere to any tool that can
    // accept a json object.     
    eventDetail(newUrl);

};

