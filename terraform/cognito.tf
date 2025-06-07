# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"

  # Configuración de políticas de contraseñas
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Configuración de atributos de usuario
  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  # Configuración de recuperación de contraseña
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Configuración de verificación de email
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Tu código de verificación para Mi Condominio"
    email_message        = "Tu código de verificación es {####}"
  }

  # Schema personalizado para roles
  schema {
    attribute_data_type = "String"
    name                = "role"
    developer_only_attribute = false
    mutable                  = true
    required                 = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Schema para inmueble_id
  schema {
    attribute_data_type = "String"
    name                = "inmueble_id"
    developer_only_attribute = false
    mutable                  = true
    required                 = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = local.common_tags
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  
  callback_urls = [
    "http://localhost:3000/callback",
    "https://${aws_s3_bucket.frontend.bucket_domain_name}/callback"
  ]
  
  logout_urls = [
    "http://localhost:3000/logout",
    "https://${aws_s3_bucket.frontend.bucket_domain_name}/logout"
  ]

  supported_identity_providers = ["COGNITO"]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Configuración de tokens
  access_token_validity = 60   # 1 hora
  id_token_validity     = 60   # 1 hora
  refresh_token_validity = 30  # 30 días

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.name_prefix}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = local.common_tags
}

# IAM Role para usuarios autenticados
resource "aws_iam_role" "authenticated" {
  name = "${local.name_prefix}-cognito-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# Política para usuarios autenticados
resource "aws_iam_role_policy" "authenticated" {
  name = "${local.name_prefix}-cognito-authenticated-policy"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.documents.arn}/private/$${cognito-identity.amazonaws.com:sub}/*"
        ]
      }
    ]
  })
}

# Adjuntar roles al Identity Pool
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.authenticated.arn
  }
}

# Outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito user pool client"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_identity_pool_id" {
  description = "ID of the Cognito identity pool"
  value       = aws_cognito_identity_pool.main.id
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = aws_cognito_user_pool_domain.main.domain
} 