# Guía de Despliegue - Mi Condominio

Esta guía te ayudará a desplegar el sistema Mi Condominio en AWS usando Terraform y GitHub Actions.

## 🏗️ Arquitectura de Despliegue

El sistema utiliza una arquitectura serverless en AWS con los siguientes componentes:

### Autenticación y API
- **AWS Cognito**: User Pool para autenticación y autorización
- **API Gateway**: Endpoint único con Cognito Authorizer para todos los microservicios
- **Lambda Functions**: Un microservicio por función (inmuebles, cuotas, gastos, junta, pagos, notificaciones)

### Bases de Datos
- **Aurora PostgreSQL Serverless v2**: Para datos relacionales de los microservicios
- **DynamoDB**: Para el sistema de notificaciones
- **S3**: Para almacenamiento de documentos y comprobantes

### Comunicación y Frontend
- **EventBridge**: Bus de eventos para comunicación entre microservicios
- **S3 + CloudFront**: Hosting del frontend
- **SES**: Para envío de notificaciones por email

### Monitoreo y Seguridad
- **CloudWatch**: Logs y métricas
- **KMS**: Encriptación de datos
- **VPC**: Red aislada con subnets públicas, privadas y de base de datos

## 🚀 Métodos de Despliegue

### Opción 1: Despliegue Automático con GitHub Actions (Recomendado)

#### Prerequisitos
1. Cuenta de AWS con permisos administrativos
2. Repositorio en GitHub
3. Credenciales de AWS

#### Pasos:

1. **Configurar Secrets en GitHub**
   ```
   Ir a: Repositorio → Settings → Secrets and variables → Actions
   
   Agregar los siguientes secrets:
   - AWS_ACCESS_KEY_ID: Tu Access Key de AWS
   - AWS_SECRET_ACCESS_KEY: Tu Secret Key de AWS
   - TERRAFORM_STATE_BUCKET: Nombre del bucket para estado de Terraform
   ```

2. **Crear bucket para estado de Terraform**
   ```bash
   # Crear bucket único (reemplazar '123456' con un valor único)
   aws s3 mb s3://g2-mi-condominio-terraform-state-123456
   
   # Habilitar versionado
   aws s3api put-bucket-versioning --bucket g2-mi-condominio-terraform-state-123456 --versioning-configuration Status=Enabled
   ```

3. **Configurar backend de Terraform**
   
   Editar `terraform/main.tf` y descomentar el backend S3:
   ```hcl
   backend "s3" {
     bucket = "g2-mi-condominio-terraform-state-123456"
     key    = "infrastructure/terraform.tfstate"
     region = "us-east-1"
   }
   ```

4. **Configurar variables**
   
   Editar `terraform/terraform.tfvars.example` con tus valores y renombrar a `terraform.tfvars`:
   ```hcl
   environment  = "dev"  # o "prod"
   aws_region   = "us-east-1"
   project_name = "g2-mi-condominio"
   github_repo  = "rodrigoberrios/utec-mi-condominio"
   ```

5. **Hacer push al repositorio**
   ```bash
   git add .
   git commit -m "Add Terraform infrastructure and CI/CD"
   git push origin main
   ```

6. **Verificar despliegue**
   - Ve a la pestaña "Actions" en GitHub
   - Revisa que el workflow se ejecute exitosamente
   - Los outputs aparecerán en los logs del job "Deploy Infrastructure"

### Opción 2: Despliegue Manual con Terraform

#### Prerequisitos
1. AWS CLI configurado
2. Terraform >= 1.0.0 instalado
3. Node.js 18+ para construir los microservicios

#### Pasos:

1. **Construir los microservicios**
   ```bash
   # Instalar dependencias
   npm install
   
   # Construir todos los microservicios
   npm run build
   
   # Crear paquetes de despliegue
   mkdir -p dist
   
   # Para cada microservicio
   for service in ms-inmuebles ms-cuotas ms-gastos ms-junta ms-pagos ms-notificaciones; do
     if [ -d "$service" ]; then
       cd $service
       npm ci --only=production
       zip -r ../dist/${service}.zip . -x "*.git*" "node_modules/.cache/*" "*.md"
       cd ..
     fi
   done
   
   # Crear common layer
   mkdir -p layer/nodejs
   cp package.json layer/nodejs/
   cd layer/nodejs && npm ci --only=production && cd ../..
   zip -r dist/common-layer.zip layer/
   ```

2. **Configurar Terraform**
   ```bash
   cd terraform
   
   # Copiar archivo de variables
   cp terraform.tfvars.example terraform.tfvars
   # Editar terraform.tfvars con tus valores
   
   # Inicializar Terraform
   terraform init
   
   # Planificar despliegue
   terraform plan
   
   # Aplicar configuración
   terraform apply
   ```

3. **Configurar base de datos**
   ```bash
   # Obtener credenciales de la base de datos
   DB_HOST=$(terraform output -raw aurora_cluster_endpoint)
   DB_SECRET_ARN=$(terraform output -raw aurora_secret_arn)
   
   # Obtener contraseña del secret manager
   SECRET=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_ARN --query SecretString --output text)
   DB_PASSWORD=$(echo $SECRET | jq -r .password)
   DB_USER=$(echo $SECRET | jq -r .username)
   DB_NAME=$(echo $SECRET | jq -r .dbname)
   
   # Aplicar esquema de base de datos
   export PGPASSWORD=$DB_PASSWORD
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ../database-schema.sql
   ```

## 📋 Configuración Post-Despliegue

### 1. Obtener información de la infraestructura
```bash
cd terraform
terraform output
```

Los outputs importantes incluyen:
- `api_gateway_url`: URL base de la API
- `cognito_user_pool_id`: ID del user pool para el frontend
- `cognito_user_pool_client_id`: Client ID para autenticación
- `cloudfront_domain_name`: URL del frontend

### 2. Configurar usuarios iniciales en Cognito

```bash
# Crear usuario administrador
aws cognito-idp admin-create-user \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username admin@micondominio.com \
  --user-attributes Name=email,Value=admin@micondominio.com \
  --message-action SUPPRESS \
  --temporary-password TempPassword123!

# Establecer contraseña permanente
aws cognito-idp admin-set-user-password \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username admin@micondominio.com \
  --password MySecurePassword123! \
  --permanent
```

### 3. Configurar atributos personalizados
```bash
# Establecer rol de usuario
aws cognito-idp admin-update-user-attributes \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username admin@micondominio.com \
  --user-attributes Name=custom:role,Value=admin
```

## 🔧 Configuración del Frontend

Si tienes un frontend, configúralo con las variables obtenidas:

```javascript
// config.js
export const config = {
  API_URL: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev',
  COGNITO: {
    USER_POOL_ID: 'us-east-1_xxxxxxxxx',
    CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    REGION: 'us-east-1'
  }
};
```

## 🧪 Verificación del Despliegue

### 1. Verificar API Gateway
```bash
# Obtener token de Cognito (usar herramienta como Postman o script)
# Luego hacer request a la API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "$(terraform output -raw api_gateway_url)/inmuebles"
```

### 2. Verificar EventBridge
- Los eventos se pueden verificar en CloudWatch Logs
- Buscar logs de las Lambda functions en `/aws/lambda/`

### 3. Verificar Base de Datos
```bash
# Conectar a Aurora
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Verificar tablas
\dt
```

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Código de Microservicios
```bash
# Reconstruir y redesplegar
npm run build
# ... crear nuevos zips ...
terraform apply
```

### Actualizar Infraestructura
```bash
# Hacer cambios en archivos .tf
terraform plan
terraform apply
```

### Monitoreo
- **CloudWatch Logs**: `/aws/lambda/`, `/aws/apigateway/`
- **CloudWatch Metrics**: Lambda, API Gateway, Aurora
- **X-Ray**: Tracing distribuido habilitado

## 🐛 Solución de Problemas

### Error: "Lambda deployment package not found"
```bash
# Verificar que existen los archivos ZIP
ls -la dist/
# Si no existen, construir los paquetes de nuevo
```

### Error: "Access denied" en API Gateway
- Verificar que el token de Cognito es válido
- Verificar que el usuario tienen los permisos apropiados
- Revisar logs de CloudWatch

### Error: "Database connection failed"
- Verificar que las Lambda están en la VPC correcta
- Verificar security groups
- Verificar credenciales en Secrets Manager

### Error: EventBridge events no se procesan
- Verificar que las reglas de EventBridge están activas
- Verificar permisos de Lambda para ser invocada por EventBridge
- Revisar logs de CloudWatch

## 💰 Estimación de Costos

### Ambiente de Desarrollo
- Aurora Serverless v2: ~$25/mes
- Lambda (1M invocaciones): ~$5/mes
- API Gateway (1M requests): ~$10/mes
- S3 + CloudFront: ~$5/mes
- **Total estimado: ~$45/mes**

### Ambiente de Producción
- Aurora Serverless v2: ~$100/mes
- Lambda (10M invocaciones): ~$20/mes
- API Gateway (10M requests): ~$30/mes
- S3 + CloudFront: ~$15/mes
- **Total estimado: ~$165/mes**

## 📞 Soporte

Para problemas con el despliegue:

1. **Revisar logs**: CloudWatch Logs para cada servicio
2. **Verificar configuración**: Variables de Terraform y secrets de GitHub
3. **Documentación AWS**: Para servicios específicos
4. **Issues GitHub**: Para problemas conocidos del proyecto

## 🔐 Seguridad

### Credenciales
- Usar AWS IAM roles con permisos mínimos
- Rotar credenciales regularmente
- No commitar credenciales al repositorio

### Red
- Lambda functions en subnets privadas
- Base de datos en subnets aisladas
- Security groups con acceso restringido

### Datos
- Encriptación en tránsito y reposo
- Uso de KMS para claves de encriptación
- Secrets Manager para credenciales sensibles