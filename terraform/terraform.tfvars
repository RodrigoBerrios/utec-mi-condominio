# Configuración de Terraform para Mi Condominio
# Copiar este archivo a terraform.tfvars y completar con los valores apropiados

# Configuración básica
environment = "dev"  # dev, staging, prod
aws_region  = "us-east-1"
project_name = "g2-mi-condominio"

# GitHub repository (para CI/CD)
github_repo = "rodrigoberrios/utec-mi-condominio"

# Variables opcionales (pueden mantenerse con valores por defecto)
# Las demás variables tienen valores por defecto en main.tf