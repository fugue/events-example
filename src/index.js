/* eslint-disable no-await-in-loop, no-constant-condition */
const aws = require('aws-sdk');
const https = require('https');
const splunk = require('splunk-logging');
const bunyan = require('bunyan');

const log = bunyan.createLogger({ name: 'fugue-events' });

let secretValue = null;

async function getSecret(secretName, region) {
  const client = new aws.SecretsManager({ region });
  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data.SecretString));
      }
    });
  });
}

async function getEvents(apiUrl, clientId, clientSecret, offset) {
  const options = {
    method: 'GET',
    auth: `${clientId}:${clientSecret}`,
  };
  let getUrl = apiUrl;
  if (offset) {
    getUrl += `?offset=${offset}`;
  }
  return new Promise((resolve, reject) => {
    const req = https.get(getUrl, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const json = JSON.parse(body);
        if (res.statusCode !== 200) {
          reject(new Error(`Fugue API returned ${res.statusCode}: ${json.message}`));
        } else {
          resolve(json);
        }
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function sendToSplunk(splunkLogger, payload) {
  return new Promise((resolve, reject) => {
    splunkLogger.send(payload, (err, resp, body) => {
      if (err) {
        reject(new Error(`Error sending to Splunk: ${err}`));
      } else {
        resolve(body);
      }
    });
  });
}

async function getConfiguration() {
  // Retrieve secret ARN from the environment
  const secretArn = process.env.SECRET_ARN;
  if (!secretArn) {
    log.error('SECRET_ARN is unset');
    throw Error('SECRET_ARN is unset');
  }
  // Retrieve Splunk publishing URL from the environment
  const splunkUrl = process.env.SPLUNK_URL;
  if (!splunkUrl) {
    log.error('SPLUNK_URL is unset');
    throw Error('SPLUNK_URL is unset');
  }
  // Retrieve the secret itself
  if (!secretValue) {
    secretValue = await getSecret(secretArn);
  }
  // Extract the Fugue API credentials and the Splunk API token from the secret
  const fugueId = secretValue.FUGUE_API_ID;
  const fugueSecret = secretValue.FUGUE_API_SECRET;
  const splunkToken = secretValue.SPLUNK_TOKEN;
  if (!fugueId) {
    log.error('FUGUE_API_ID is not in the secret');
    throw Error('FUGUE_API_ID is not in the secret');
  }
  if (!fugueSecret) {
    log.error('FUGUE_API_SECRET is not in the secret');
    throw Error('FUGUE_API_SECRET is not in the secret');
  }
  if (!splunkToken) {
    log.error('SPLUNK_TOKEN is not in the secret');
    throw Error('SPLUNK_TOKEN is not in the secret');
  }
  return {
    splunkUrl, splunkToken, fugueId, fugueSecret,
  };
}

// eslint-disable-next-line func-names, no-unused-vars
exports.handler = async function (event, context) {
  let message;
  const rawMessage = event.Records[0].Sns.Message;
  try {
    message = JSON.parse(rawMessage);
  } catch (err) {
    log.warn('Ignoring non-JSON message:', rawMessage);
    return 0;
  }

  // Extract key information from the Fugue notification
  const apiUrl = message.api_url;
  const scanId = message.scan_id;
  const environmentId = message.environment_id;
  const environmentName = message.environment_name;
  const { summary } = message;

  // Get API credentials and other configuration
  const conf = await getConfiguration();

  // Each request will retrieve up to 100 events. Loop as needed to retrieve
  // all events by updating the `offset` query parameter as needed.
  let offset = 0;
  const events = [];
  while (true) {
    const response = await getEvents(apiUrl, conf.fugueId, conf.fugueSecret, offset);
    events.push(...response.items);
    if (!response.is_truncated) {
      break;
    }
    offset = response.next_offset;
  }

  log.info({
    count: events.length,
    scan_id: scanId,
    environment_id: environmentId,
    environment_name: environmentName,
    summary,
  }, 'Retrieved events from Fugue');

  // Create Splunk logger with configured URL and token
  const splunkLogger = new splunk.Logger({
    token: conf.splunkToken,
    url: conf.splunkUrl,
    maxBatchCount: 1,
  });

  log.info({ splunk_url: conf.splunkUrl }, 'Sending events to Splunk');

  // Loop to send each event and some metadata to Splunk
  for (let i = 0; i < events.length; i += 1) {
    const fugueEvent = events[i];
    const response = await sendToSplunk(splunkLogger, {
      event: fugueEvent,
      scan_id: scanId,
      environment_id: environmentId,
      environment_name: environmentName,
      summary,
    });
    log.info({
      event_id: fugueEvent.id,
      event_type: fugueEvent.event_type,
      index: i,
      response,
    }, 'Event sent to Splunk');
  }

  return events.length;
};
