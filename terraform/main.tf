terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configurar después con los valores específicos
    # bucket = "g2-mi-condominio-terraform-state"
    # key    = "infrastructure/terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "MiCondominio"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources para obtener información de AWS
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Variables de configuración
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "g2-mi-condominio"
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = ""
}

# Locals para nombres consistentes
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = "MiCondominio"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
} 