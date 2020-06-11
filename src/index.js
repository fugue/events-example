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

async function getEvents (apiUrl, clientId, clientSecret) {
  const options = {
    method: 'GET',
    auth: clientId + ':' + clientSecret
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

exports.handler = async function (event, context) {
  const message = JSON.parse(event.Records[0].Sns.Message)

  const secretArn = process.env.SECRET_ARN
  if (!secretArn) {
    throw Error('SECRET_ARN is unset')
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

  const events = await getEvents(apiUrl, fugueId, fugueSecret)
  if (events.is_truncated) {
    console.log('Response was truncated. Next offset:', events.next_offset)
  }

  for (let i = 0; i < events.items.length; i++) {
    console.log('Event:', events.items[i])
  }
  return events.length
}
