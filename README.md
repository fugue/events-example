# Fugue Events

This project is an example of using the Fugue API to retrieve and process
compliance and drift JSON events in an AWS Lambda function.

The Lambda retrieves events from the Fugue API and then sends them to Splunk.

## Overview

Two Fugue features are used in this project:

* SNS notifications - Fugue sends summary notifications to your SNS topic
  when events are detected in your infrastructure.
* REST API - The Fugue API has an endpoint used to retrieve event details.

By deploying the Cloudformation [template](./template.yaml) in this project,
you will begin receiving notifications in your own AWS account and you can
build reactive integrations with these infrastructure events.

## Requirements

You will need the following to get started:

* Active AWS credentials
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* GNU Make (recommended)

Confirm you have the required binaries by running these commands:

```bash
$ aws --version
$ sam --version
$ make --version
```

## Variables

The following environment variables must be set locally to deploy this application:

* `SPLUNK_URL` - Splunk HTTP event collector URL
* `SPLUNK_TOKEN` - Splunk authentication token
* `FUGUE_API_ID` - Fugue API client ID
* `FUGUE_API_SECRET` - Fugue API client secret

See the [Fugue Documentation](https://docs.fugue.co/api.html#api-client-id-secret)
for instructions on creating Fugue API credentials.

## Install

AWS SAM is used to build a NodeJS Lambda and deploy it as part of
a CloudFormation stack. We recommend using the Makefile and its targets to
run the build and deploy, although you could also use the SAM CLI directly if
you wish. See the [Makefile](./Makefile) for more information.

Once you have the environment variables set, run the following commands to build
and deploy the application:

```bash
$ make deploy
$ make update_secret
```

The SAM CLI will prompt you for some input prior to deployment.

## Secret Management

AWS SecretsManager is used to store credentials for the Fugue and Splunk APIs.
The `make update_secret` command stores several of the variables mentioned above
in a SecretsManager secret that is then accessed by the Lambda at runtime.

## Cleanup

To remove these resources from your account, delete its CloudFormation stack
in the AWS console or use the following command:

```bash
$ make teardown
```
