# Fugue Events

This project is an example of using the Fugue API to retrieve and process
compliance and drift JSON events in an AWS Lambda function.

Once the Lambda has the events, it may then pass them to other services like
Splunk, Slack, and others.

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
* [Fugue API Client ID and Secret](https://docs.fugue.co/api.html#api-client-id-secret)

Confirm the AWS CLI and SAM are installed correctly by running these commands
to show version information:

```bash
aws --version
sam --version
```

## Deploy Using SAM

To build and deploy the Lambda using SAM and CloudFormation, run the following
in your shell:

```bash
sam build
sam deploy --guided
```

The second command offers a series of prompts to configure the deployment.

## Providing Fugue API Credentials to the Lambda Function

The SAM deploy creates a secret in AWS SecretsManager that is accessed by the
Lambda at runtime to retrieve credentials for the Fugue API.

Note the secret ARN is output at the end of the `sam deploy` command.

You will need to run the following command to store your Fugue API client ID
and client secret:

```
aws secretsmanager put-secret-value \
    --secret-id <SECRET_ARN> \
    --secret-string '{"FUGUE_API_ID":"YOUR_CLIENT_ID","FUGUE_API_SECRET":"YOUR_CLIENT_SECRET"}'
```

The [Makefile](./Makefile) contains a helper target that can be used to
retrieve the secret ARN and run the above command. To use it, set environment
variables in your environment as follows and then run the make command:

```
export FUGUE_API_ID=<YOUR_CLIENT_ID>
export FUGUE_API_SECRET=<YOUR CLIENT SECRET>
make update_secret
```

## Cleanup

To remove these resources from your account, delete its CloudFormation stack
in the AWS console or use the following AWS CLI command:

```bash
aws cloudformation delete-stack --stack-name fugue-events
```
