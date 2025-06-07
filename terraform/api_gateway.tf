# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "API Gateway para el sistema Mi Condominio"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  binary_media_types = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "multipart/form-data"
  ]

  tags = local.common_tags
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${local.name_prefix}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.main.arn]
  identity_source = "method.request.header.Authorization"
}

# Recursos de API para cada microservicio
locals {
  microservices = [
    {
      name = "inmuebles"
      path = "inmuebles"
    },
    {
      name = "cuotas"
      path = "cuotas"
    },
    {
      name = "gastos"
      path = "gastos"
    },
    {
      name = "junta"
      path = "junta"
    },
    {
      name = "pagos"
      path = "pagos"
    },
    {
      name = "notificaciones"
      path = "notificaciones"
    }
  ]
}

# Crear recursos para cada microservicio
resource "aws_api_gateway_resource" "microservice" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.value.path
}

# Crear proxy resource para capturar todas las rutas de cada microservicio
resource "aws_api_gateway_resource" "microservice_proxy" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.microservice[each.key].id
  path_part   = "{proxy+}"
}

# Métodos ANY para el recurso raíz de cada microservicio
resource "aws_api_gateway_method" "microservice_root" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.microservice[each.key].id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Métodos ANY para el proxy de cada microservicio
resource "aws_api_gateway_method" "microservice_proxy" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Integraciones con Lambda para el recurso raíz
resource "aws_api_gateway_integration" "microservice_root" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice[each.key].id
  http_method = aws_api_gateway_method.microservice_root[each.key].http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice[each.key].invoke_arn
}

# Integraciones con Lambda para el proxy
resource "aws_api_gateway_integration" "microservice_proxy" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method = aws_api_gateway_method.microservice_proxy[each.key].http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice[each.key].invoke_arn
}

# Configuración CORS para cada recurso
resource "aws_api_gateway_method" "microservice_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.microservice[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "microservice_proxy_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "microservice_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice[each.key].id
  http_method = aws_api_gateway_method.microservice_options[each.key].http_method

  type                 = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "microservice_proxy_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method = aws_api_gateway_method.microservice_proxy_options[each.key].http_method

  type                 = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Respuestas CORS
resource "aws_api_gateway_method_response" "microservice_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice[each.key].id
  http_method = aws_api_gateway_method.microservice_options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_method_response" "microservice_proxy_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method = aws_api_gateway_method.microservice_proxy_options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "microservice_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice[each.key].id
  http_method = aws_api_gateway_method.microservice_options[each.key].http_method
  status_code = aws_api_gateway_method_response.microservice_options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "microservice_proxy_options" {
  for_each = { for ms in local.microservices : ms.name => ms }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.microservice_proxy[each.key].id
  http_method = aws_api_gateway_method.microservice_proxy_options[each.key].http_method
  status_code = aws_api_gateway_method_response.microservice_proxy_options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.microservice_root,
    aws_api_gateway_integration.microservice_proxy,
    aws_api_gateway_integration.microservice_options,
    aws_api_gateway_integration.microservice_proxy_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.microservice,
      aws_api_gateway_method.microservice_root,
      aws_api_gateway_integration.microservice_root,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  # Configuración de logging
  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = local.common_tags
}

# CloudWatch Log Group para API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = 14
  tags              = local.common_tags
}

# Output
output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
} 