# IAM Role para Lambda Functions
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Policy básica para Lambda
resource "aws_iam_role_policy" "lambda_basic" {
  name = "${local.name_prefix}-lambda-basic-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy para acceso a RDS
resource "aws_iam_role_policy" "lambda_rds" {
  name = "${local.name_prefix}-lambda-rds-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = [
          "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora.cluster_identifier}/*"
        ]
      }
    ]
  })
}

# Policy para acceso a DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.name_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.notifications.arn,
          "${aws_dynamodb_table.notifications.arn}/index/*"
        ]
      }
    ]
  })
}

# Policy para acceso a S3
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${local.name_prefix}-lambda-s3-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn
        ]
      }
    ]
  })
}

# Policy para EventBridge
resource "aws_iam_role_policy" "lambda_eventbridge" {
  name = "${local.name_prefix}-lambda-eventbridge-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          aws_cloudwatch_event_bus.main.arn
        ]
      }
    ]
  })
}

# Policy para SES (notificaciones)
resource "aws_iam_role_policy" "lambda_ses" {
  name = "${local.name_prefix}-lambda-ses-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Security Group para Lambda Functions
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# JWT Secret para autenticación
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.name_prefix}-jwt-secret"
  description             = "JWT secret for Mi Condominio authentication"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    jwt_secret = "mi-condominio-jwt-secret-${var.environment}-${random_password.jwt_secret.result}"
  })
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

# CloudWatch Log Groups para cada microservicio
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = { for ms in local.microservices : ms.name => ms }

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = 14
  tags              = local.common_tags
}

# Lambda Functions para cada microservicio
resource "aws_lambda_function" "microservice" {
  for_each = { for ms in local.microservices : ms.name => ms }

  filename         = "${path.module}/../dist/${each.key}.zip"
  function_name    = "${local.name_prefix}-${each.key}"
  role            = aws_iam_role.lambda.arn
  handler         = "src/handlers/${each.key}.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  # Configuración de VPC
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  # Variables de entorno
  environment {
    variables = {
      # Variables básicas del sistema
      NODE_ENV           = var.environment
      AWS_REGION        = data.aws_region.current.name
      
      # Base de datos PostgreSQL
      DB_HOST           = aws_rds_cluster.aurora.endpoint
      DB_PORT           = "5432"
      DB_NAME           = aws_rds_cluster.aurora.database_name
      DB_USER           = aws_rds_cluster.aurora.master_username
      DB_PASSWORD       = aws_rds_cluster.aurora.master_password
      
      # Servicios AWS
      S3_BUCKET         = aws_s3_bucket.documents.bucket
      EVENTBRIDGE_BUS   = aws_cloudwatch_event_bus.main.name
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      
      # DynamoDB (solo para notificaciones)
      DYNAMODB_TABLE    = each.key == "notificaciones" ? aws_dynamodb_table.notifications.name : ""
      
      # Variables adicionales opcionales
      LOG_LEVEL         = var.environment == "prod" ? "info" : "debug"
      JWT_SECRET_ARN    = aws_secretsmanager_secret.jwt_secret.arn  # Usar Secrets Manager
      API_VERSION       = "v1"
      CORS_ORIGIN       = var.environment == "prod" ? "https://micondominio.com" : "*"
      
      # Variables específicas por microservicio
      SERVICE_NAME      = each.key
      SERVICE_VERSION   = "1.0.0"
      
      # Configuración de correo (para notificaciones)
      SES_FROM_EMAIL    = var.environment == "prod" ? "noreply@micondominio.com" : "test@example.com"
      SES_REGION        = data.aws_region.current.name
    }
  }

  # Tracing
  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy.lambda_basic,
    aws_cloudwatch_log_group.lambda,
  ]

  tags = local.common_tags
}

# Permisos para que API Gateway invoque las Lambda functions
resource "aws_lambda_permission" "api_gateway" {
  for_each = { for ms in local.microservices : ms.name => ms }

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Lambda Layer para dependencias comunes
resource "aws_lambda_layer_version" "common" {
  filename         = "${path.module}/../dist/common-layer.zip"
  layer_name       = "${local.name_prefix}-common-layer"
  description      = "Common dependencies for microservices"
  
  compatible_runtimes = ["nodejs18.x"]
  
  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "lambda_functions" {
  description = "Lambda function names and ARNs"
  value = {
    for k, v in aws_lambda_function.microservice : k => {
      name = v.function_name
      arn  = v.arn
    }
  }
} 