# Fugue Events API



## Deploy the sample application

To build and deploy your application for the first time, run the following
in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command
will package and deploy your application to AWS, with a series of prompts:

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name fugue-events
```
