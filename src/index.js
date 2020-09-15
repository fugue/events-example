/* 
  Go to your Fugue Tenant Dashboard and create an API Client.
  Note your CLIENT_ID and your CLIENT_SECRET at the bottom of this screen,
  input those values as Environment Variables.

  This function will extract the details of your Fugue Event
  (Compliance, Drift, Remediation) and log them to any 3rd party tool that you
  may be using to generate reports.  The message is set as variable called
  "body".  This will be your output parameter to be sent to any 3rd party tool. 
*/

const aws = require('aws-sdk')
const https = require('https')
const url = require('url')

var secretValue = null

async function getSecret (secretName, region) {
  var client = new aws.SecretsManager({ region: region })
  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data.SecretString))
      }
    })
  })
}

async function getEvents (apiUrl, clientId, clientSecret, offset) {
  const options = {
    method: 'GET',
    auth: clientId + ':' + clientSecret
  }
  if (offset) {
    apiUrl += '?offset=' + offset
  }
  return new Promise((resolve, reject) => {
    const req = https.get(apiUrl, options, res => {
      let body = ''
      res.on('data', chunk => {
        body += chunk
      })
      res.on('end', () => {
        let json = JSON.parse(body)
        if (res.statusCode != 200) {
          reject(new Error('ERROR ' + res.statusCode + ': ' + json.message))
        } else {
          resolve(json)
        }
      })
    })
    req.on('error', error => {
      reject(error)
    })
  })
}

async function shareOnSlack(channel, userName, text, emoji, message, webhookUrl) {

  const message = event.Records[0].Sns.Message;
  const parsedUrl = url.Parse(webhookUrl);
  const postData = {
      "channel": channel,
      "username": userName,
      "text": text,
      "icon_emoji": emoji,
      "attachments": [{ "text": message }],
  };
  const options = {
      method: 'POST',
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      context.done(null);
    });
  });

  req.on('error', function(e) { console.log('problem with request: ' + e.message); });
  req.write(JSON.stringify(postData));
  req.end();
}

exports.handler = async function (event, context) {

  var message;
  const rawMessage = event.Records[0].Sns.Message
  try {
    message = JSON.parse(rawMessage)
  } catch (err) {
    console.log('Ignoring non-JSON message:', rawMessage)
    return
  }

  const secretArn = process.env.SECRET_ARN
  if (!secretArn) {
    throw Error('SECRET_ARN is unset')
  }
  const webhookUrl = process.env.WEBHOOK_URL
  if (!webhookUrl) {
    throw Error('WEBHOOK_URL is unset')
  }
  const slackChannel = process.env.SLACK_CHANNEL
  if (!slackChannel) {
    throw Error('SLACK_CHANNEL is unset')
  }
  const slackUsername = process.env.SLACK_USERNAME
  if (!slackUsername) {
    throw Error('SLACK_USERNAME is unset')
  }

  if (!secretValue) {
    secretValue = await getSecret(secretArn)
  }
  const fugueId = secretValue.FUGUE_API_ID
  const fugueSecret = secretValue.FUGUE_API_SECRET
  const apiUrl = message.api_url

  if (!fugueId || !fugueSecret) {
    throw Error('Fugue API credentials not found in secret')
  }

  console.log('Requesting events:', apiUrl)

  var offset = 0;
  var events = [];

  // Each request will retrieve up to 100 events. Loop as needed to retrieve
  // all events by updating the `offset` query parameter as needed.
  while (true) {
    const response = await getEvents(apiUrl, fugueId, fugueSecret, offset)
    events.push(...response.items)
    if (!response.is_truncated) {
      break
    }
    console.log('Response was truncated. Next offset:', response.next_offset)
    offset = response.next_offset
  }

  console.log('Retrieved', events.length, 'events')
  for (let i = 0; i < events.length; i++) {
    console.log('Event:', events[i])
  }

  shareOnSlack(slackChannel, slackUsername, "HEY", null, "MESSAGE", webhookUrl)

  console.log('Shared on Slack!')

  return events.length
}
