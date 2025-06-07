# Infraestructura AWS - Mi Condominio

Esta carpeta contiene la configuración de Terraform para desplegar la infraestructura completa del sistema Mi Condominio en AWS.

## Arquitectura

La infraestructura incluye:

- **VPC** con subnets públicas, privadas y de base de datos
- **Cognito User Pool** para autenticación y autorización
- **API Gateway** con Cognito Authorizer para todos los microservicios
- **Lambda Functions** para cada microservicio (inmuebles, cuotas, gastos, junta, pagos, notificaciones)
- **Aurora PostgreSQL Serverless v2** para datos relacionales
- **DynamoDB** para notificaciones
- **EventBridge** para comunicación entre microservicios
- **S3** para documentos y hosting del frontend
- **CloudFront** para distribución del frontend
- **CloudWatch** para logs y monitoreo
- **KMS** para encriptación

## Requisitos Previos

1. **AWS CLI** configurado con credenciales apropiadas
2. **Terraform** >= 1.0.0 instalado
3. **Permisos AWS** para crear todos los recursos definidos

## Configuración Inicial

### 1. Crear bucket para estado de Terraform

```bash
# Crear bucket para almacenar el estado de Terraform
aws s3 mb s3://g2-mi-condominio-terraform-state-unique-suffix
aws s3api put-bucket-versioning --bucket g2-mi-condominio-terraform-state-unique-suffix --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket g2-mi-condominio-terraform-state-unique-suffix --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}'
```

### 2. Configurar variables

```bash
# Copiar archivo de variables de ejemplo
cp terraform.tfvars.example terraform.tfvars

# Editar con tus valores específicos
nano terraform.tfvars
```

### 3. Configurar backend remoto

Editar `main.tf` y descomentar la sección del backend S3, actualizando el nombre del bucket:

```hcl
backend "s3" {
  bucket = "g2-mi-condominio-terraform-state-unique-suffix"
  key    = "infrastructure/terraform.tfstate"
  region = "us-east-1"
}
```

## Despliegue

### Inicializar Terraform

```bash
cd terraform
terraform init
```

### Planificar despliegue

```bash
terraform plan
```

### Aplicar configuración

```bash
terraform apply
```

### Verificar recursos

```bash
# Ver outputs importantes
terraform output

# Ver estado actual
terraform show
```

## Outputs Importantes

Después del despliegue, Terraform mostrará:

- **API Gateway URL**: URL base para todos los microservicios
- **Cognito User Pool ID**: Para configuración del frontend
- **Cognito Client ID**: Para autenticación
- **CloudFront Domain**: URL del frontend
- **Aurora Endpoint**: Endpoint de la base de datos

## Estructura de Archivos

```
terraform/
├── main.tf              # Configuración principal y providers
├── vpc.tf               # Configuración de red VPC
├── cognito.tf           # Autenticación y autorización
├── api_gateway.tf       # API Gateway con Cognito Authorizer
├── lambda.tf            # Lambda functions para microservicios
├── database.tf          # Aurora PostgreSQL y DynamoDB
├── s3.tf                # Buckets S3 y CloudFront
├── eventbridge.tf       # Comunicación entre microservicios
├── terraform.tfvars.example  # Variables de ejemplo
└── README.md            # Esta documentación
```

## Variables de Configuración

| Variable       | Descripción                | Valor por defecto  |
| -------------- | -------------------------- | ------------------ |
| `environment`  | Entorno (dev/staging/prod) | `dev`              |
| `aws_region`   | Región de AWS              | `us-east-1`        |
| `project_name` | Nombre del proyecto        | `g2-mi-condominio` |
| `github_repo`  | Repositorio de GitHub      | `""`               |

## Configuración por Ambiente

### Desarrollo (dev)
- Aurora: 1 instancia con mínimo scaling
- API Gateway: Sin WAF
- Logs: Retención de 7 días

### Producción (prod)
- Aurora: 2 instancias con auto-scaling
- API Gateway: Con WAF habilitado
- Logs: Retención de 30 días
- Backups: Retención de 30 días

## Seguridad

### Cognito Configuration
- Políticas de contraseña robustas
- MFA disponible (opcional)
- Tokens con expiración apropiada
- Atributos personalizados para roles

### Networking
- Lambda functions en subnets privadas
- Base de datos en subnets aisladas
- Security groups con acceso mínimo necesario

### Encryption
- Aurora con encriptación KMS
- DynamoDB con encriptación en reposo
- S3 con encriptación server-side
- Secrets Manager para credenciales

## Monitoreo

### CloudWatch Logs
- Logs de Lambda functions: `/aws/lambda/{function-name}`
- Logs de API Gateway: `/aws/apigateway/{project-name}`
- Logs de Aurora: `/aws/rds/cluster/{cluster-name}/postgresql`

### Métricas
- Lambda: Duración, errores, invocaciones
- API Gateway: Latencia, errores 4xx/5xx
- Aurora: Conexiones, CPU, memoria

## Comandos Útiles

```bash
# Ver recursos creados
terraform state list

# Ver configuración de un recurso específico
terraform state show aws_lambda_function.microservice["inmuebles"]

# Importar recurso existente
terraform import aws_s3_bucket.existing_bucket bucket-name

# Destruir infraestructura (¡CUIDADO!)
terraform destroy
```

## Troubleshooting

### Error: "Backend initialization required"
```bash
terraform init -reconfigure
```

### Error: "No such bucket"
Verificar que el bucket del backend existe y tienes permisos:
```bash
aws s3 ls s3://g2-mi-condominio-terraform-state-unique-suffix
```

### Error de permisos AWS
Verificar que las credenciales tienen los permisos necesarios:
```bash
aws sts get-caller-identity
```

### Lambda deployment package no encontrado
Asegurarse de que el directorio `dist/` existe con los archivos ZIP:
```bash
ls -la ../dist/
```

## CI/CD con GitHub Actions

Ver `.github/workflows/deploy.yml` para la configuración de despliegue automático.

### Secrets requeridos en GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `TERRAFORM_STATE_BUCKET`

## Costos Estimados

### Desarrollo (uso mínimo)
- Aurora Serverless v2: ~$25/mes
- Lambda: ~$5/mes
- API Gateway: ~$10/mes
- S3: ~$5/mes
- **Total estimado: ~$45/mes**

### Producción (uso moderado)
- Aurora Serverless v2: ~$100/mes
- Lambda: ~$20/mes
- API Gateway: ~$30/mes
- S3 + CloudFront: ~$15/mes
- **Total estimado: ~$165/mes**

*Los costos pueden variar según el uso real*

## Soporte

Para problemas con la infraestructura:
1. Revisar logs de CloudWatch
2. Verificar configuración de Terraform
3. Consultar documentación de AWS
4. Revisar issues en el repositorio