TF_BACKEND_CFG=-backend-config="bucket=moggies.io-terraform-state-backend" -backend-config="dynamodb_table=moggies.io-metrics-api-terraform_state" -backend-config="key=metrics-api-terraform.state" -backend-config="region=eu-west-1"

# INFRASTRUCTURE
modules-cleanup:
	cd infra && rm -rf .terraform/modules

infra-fmt:
	cd infra && terraform fmt -recursive

infra-init:
	cd infra && terraform init -force-copy ${TF_BACKEND_CFG}

infra-debug:
	cd infra && TF_LOG=DEBUG terraform apply -auto-approve infra

infra-deploy: modules-cleanup
	cd infra && terraform init && terraform apply -auto-approve

infra-preview: modules-cleanup
	cd infra && terraform init && terraform plan

infra-destroy:
	cd infra && terraform init && terraform destroy

# CODE
build-cleanup:
	rm -rf ./dist/* & mkdir -p dist && rm -rf ./src/node_modules

build: build-cleanup
	cd src && npm i --only=prod && zip -r ../dist/metrics-api.zip ./

build-dev: build-cleanup
	cd src && npm i

lint:
	npm run lint

format:
	npm run format

test:
	npm run test

update-lambda-fn: build
	aws lambda update-function-code --function-name metrics-api --zip-file fileb://$(shell pwd)/dist/metrics-api.zip --publish | jq .FunctionArn

# NPM COMMANDS
npm-auth:
	./scripts/npm_auth.sh