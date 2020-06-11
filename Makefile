
NAME = fugue-events

.PHONY: deploy
deploy: build
	sam deploy --guided

.PHONY: build
build:
	sam build

.PHONY: teardown
teardown:
	aws cloudformation delete-stack --stack-name $(NAME)

.PHONY: clean
clean:
	rm -rf build $(ARTIFACT)
