resource "aws_dynamodb_table" "loadtest_metrics" {
  name           = "loadtest_metrics"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "LoadtestId"
  range_key      = "MetricName"

  attribute {
    name = "LoadtestId"
    type = "S"
  }

  attribute {
    name = "MetricName"
    type = "S"
  }

  // Data
}