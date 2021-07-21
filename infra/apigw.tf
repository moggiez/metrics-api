module "proxy_part" {
  source             = "git@github.com:moggiez/terraform-modules.git//lambda_gateway"
  api                = aws_api_gateway_rest_api._
  lambda             = module.api_lambda.lambda
  http_methods       = local.http_methods
  resource_path_part = "{proxy+}"
  authorizer         = local.authorizer

}

module "proxy_part_cors" {
  source          = "git@github.com:moggiez/terraform-modules.git//api_gateway_enable_cors"
  api_id          = aws_api_gateway_rest_api._.id
  api_resource_id = module.proxy_part.api_resource.id
}