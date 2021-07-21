resource "aws_iam_policy" "dynamodb_access_policy" {
  name = "metrics-api_lambda_access_dynamodb_policy"
  path = "/"

  policy = templatefile("templates/dynamo_access_policy.json", { table = aws_dynamodb_table.loadtest_metrics.name })
}

resource "aws_iam_policy" "dynamodb_access_policy_loadtests" {
  name = "metrics-api_lambda_access_dynamodb_policy_loadtests"
  path = "/"

  policy = templatefile("templates/dynamo_access_policy.json", { table = "loadtests" })
}

resource "aws_iam_policy" "dynamodb_access_policy_organisations" {
  name = "metrics-api_lambda_access_dynamodb_policy_organisations"
  path = "/"

  policy = templatefile("templates/dynamo_access_policy.json", { table = "organisations" })
}

resource "aws_iam_policy" "cloudwatch_getmetricdata_policy" {
  name = "metrics-api_cloudwatch_getmetricdata_policy"
  path = "/"

  policy = templatefile("templates/cloudwatch_metrics_read_access_policy.json", {})
}


module "api_lambda" {
  source    = "git@github.com:moggiez/terraform-modules.git//lambda_with_dynamo"
  s3_bucket = aws_s3_bucket._
  dist_dir  = "../dist"
  name      = "metrics-api"
  policies = [
    aws_iam_policy.dynamodb_access_policy.arn,
    aws_iam_policy.dynamodb_access_policy_loadtests.arn,
    aws_iam_policy.dynamodb_access_policy_organisations.arn,
    aws_iam_policy.cloudwatch_getmetricdata_policy.arn
  ]
  environment = local.environment
}

resource "aws_lambda_permission" "_" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.api_lambda.lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api._.execution_arn}/*/*"
}