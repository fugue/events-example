/* Go to your Fugue Tenant Dashboard and create an API Client.  Note your CLIENT_ID and your CLIENT_SECRET
   at the bottom of this screen, input those values as Environment Variables.

   This function will extract the details of your Fugue Event (Compliance, Drift, Remediation) and
   log them to any 3rd party tool that you may be using to generate reports.  The message is set as 
   variable called "body".  This will be your output parameter to be sent to any 3rd party tool. 
*/

exports.handler = function(event, context) {
    var https = require('https');
    const id = process.env.CLIENT_ID;
    const secret = process.env.CLIENT_SECRET;
    const options = {
        method: 'GET',
        auth: id+':'+secret
        };
    const newUrl = event.Records[0].Sns.Message.api_url;
    
    console.log(newUrl);
      
  
    https.get(newUrl, options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            //let json = JSON.parse(body);
            //let output = json.items;
            console.log(body);
        });

    }).on("error", (error) => {
        console.error(error.message);
    });
    
};