
NAME = fugue-events

SECRET_ARN ?= $(shell aws cloudformation describe-stacks \
				--stack-name $(NAME) \
				--output text \
				--query 'Stacks[0].Outputs[?OutputKey==`Secret`].OutputValue')

.PHONY: deploy
deploy: build
ifeq ($(SPLUNK_URL),)
	$(error SPLUNK_URL not set)
endif
	@echo "SPLUNK URL: $(SPLUNK_URL)"
	sam deploy \
		--guided \
		--stack-name $(NAME) \
		--template ./template.yaml \
		--no-fail-on-empty-changeset \
		--region us-east-1 \
		--tags app=$(NAME)

.PHONY: build
build:
	sam build

.PHONY: update_secret
update_secret:
ifeq ($(SECRET_ARN),)
	$(error SECRET_ARN not set)
endif
ifeq ($(FUGUE_API_ID),)
	$(error FUGUE_API_ID not set)
endif
ifeq ($(FUGUE_API_SECRET),)
	$(error FUGUE_API_SECRET not set)
endif
ifeq ($(SPLUNK_TOKEN),)
	$(error SPLUNK_TOKEN not set)
endif
	aws secretsmanager put-secret-value \
		--secret-id $(SECRET_ARN) \
		--secret-string '{"FUGUE_API_ID":"$(FUGUE_API_ID)","FUGUE_API_SECRET":"$(FUGUE_API_SECRET)","SPLUNK_TOKEN":"$(SPLUNK_TOKEN)"}'

.PHONY: teardown
teardown:
	aws cloudformation delete-stack --stack-name $(NAME)

.PHONY: clean
clean:
	rm -rf .aws-sam
	rm -rf node_modules
