# DB Subnet Group para Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

# Security Group para Aurora
resource "aws_security_group" "aurora" {
  name_prefix = "${local.name_prefix}-aurora-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora PostgreSQL cluster"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

# Generar contraseña aleatoria para Aurora
resource "random_password" "aurora_password" {
  length  = 16
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "${local.name_prefix}-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "condominio_db"
  master_username         = "postgres"
  master_password         = random_password.aurora_password.result
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  vpc_security_group_ids = [aws_security_group.aurora.id]
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  
  # Configuración de seguridad
  storage_encrypted = true
  kms_key_id       = aws_kms_key.main.arn
  
  # Configuración de maintenance
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  # Habilitar logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Configuración de backup
  skip_final_snapshot       = var.environment == "dev"
  final_snapshot_identifier = var.environment != "dev" ? "${local.name_prefix}-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # Configuración serverless v2
  serverlessv2_scaling_configuration {
    max_capacity = var.environment == "prod" ? 2 : 1
    min_capacity = 0.5
  }

  tags = local.common_tags
}

# Aurora Cluster Instances
resource "aws_rds_cluster_instance" "aurora" {
  count              = var.environment == "prod" ? 2 : 1
  identifier         = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = local.common_tags
}

# IAM Role para monitoreo de RDS
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# KMS Key para encriptación
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# DynamoDB Table para notificaciones
resource "aws_dynamodb_table" "notifications" {
  name           = "${local.name_prefix}-notifications"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "notification_id"
  range_key      = "created_at"

  attribute {
    name = "notification_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # Global Secondary Index para consultas por usuario
  global_secondary_index {
    name               = "user-index"
    hash_key           = "user_id"
    range_key          = "created_at"
    projection_type    = "ALL"
  }

  # Global Secondary Index para consultas por estado
  global_secondary_index {
    name               = "status-index"
    hash_key           = "status"
    range_key          = "created_at"
    projection_type    = "ALL"
  }

  # Time To Live
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Configuración de encriptación
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# CloudWatch Log Group para Aurora
resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/${aws_rds_cluster.aurora.cluster_identifier}/postgresql"
  retention_in_days = 7
  
  tags = local.common_tags
}

# Parameter Group personalizado para Aurora
resource "aws_rds_cluster_parameter_group" "aurora" {
  family = "aurora-postgresql15"
  name   = "${local.name_prefix}-aurora-cluster-pg"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = local.common_tags
}

# Almacenar la contraseña en AWS Secrets Manager
resource "aws_secretsmanager_secret" "aurora_password" {
  name        = "${local.name_prefix}-aurora-password"
  description = "Aurora PostgreSQL master password"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "aurora_password" {
  secret_id = aws_secretsmanager_secret.aurora_password.id
  secret_string = jsonencode({
    username = aws_rds_cluster.aurora.master_username
    password = random_password.aurora_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.aurora.database_name
  })
}

# Outputs
output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for notifications"
  value       = aws_dynamodb_table.notifications.name
}

output "aurora_secret_arn" {
  description = "ARN of the Aurora password secret"
  value       = aws_secretsmanager_secret.aurora_password.arn
} 