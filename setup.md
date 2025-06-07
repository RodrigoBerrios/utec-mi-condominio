# Guía de Instalación - Mi Condominio

## Prerrequisitos

- Node.js 18+ 
- npm o yarn
- AWS CLI configurado
- PostgreSQL (para desarrollo local)
- Cuenta de AWS con permisos para Lambda, API Gateway, EventBridge, S3, DynamoDB

## Instalación

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del workspace principal
npm install

# Instalar dependencias de cada microservicio
npm install --workspaces
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables según tu entorno
nano .env
```

### 3. Configurar base de datos PostgreSQL

```bash
# Crear base de datos
createdb condominio_db

# Ejecutar esquema
psql -d condominio_db -f database-schema.sql
```

### 4. Configurar AWS

```bash
# Configurar AWS CLI si no está configurado
aws configure

# Crear EventBridge bus personalizado
aws events create-event-bus --name condominio-events

# Crear bucket S3 para comprobantes
aws s3 mb s3://condominio-comprobantes
```

## Desarrollo Local

### Ejecutar un microservicio individualmente

```bash
cd ms-inmuebles
npm run dev
```

### Ejecutar todos los microservicios

```bash
# En terminales separadas
cd ms-inmuebles && npm run dev
cd ms-cuotas && npm run dev  
cd ms-gastos && npm run dev
cd ms-junta && npm run dev
cd ms-notificaciones && npm run dev
```

## Despliegue

### Desplegar un microservicio

```bash
cd ms-inmuebles
npm run deploy
```

### Desplegar todos los microservicios

```bash
npm run deploy
```

## Testing

### Ejecutar tests de un microservicio

```bash
cd ms-inmuebles
npm test
```

### Ejecutar todos los tests

```bash
npm test
```

## Estructura de URLs (después del despliegue)

### ms-inmuebles
- `POST /inmuebles` - Crear inmueble
- `GET /inmuebles` - Listar inmuebles
- `POST /juntas` - Crear junta
- `GET /juntas` - Listar juntas

### ms-cuotas
- `POST /cuotas` - Crear cuota
- `GET /cuotas` - Listar cuotas
- `GET /estado-cuenta/{idUsuario}` - Estado de cuenta
- `GET /morosidad` - Usuarios morosos

### ms-gastos
- `POST /gastos` - Crear gasto
- `GET /gastos` - Listar gastos
- `POST /gastos/comprobantes` - Subir comprobante
- `GET /gastos/comprobantes` - Obtener comprobantes
- `GET /gastos/resumen` - Resumen de gastos

### ms-junta
- `POST /aprobaciones-extraordinarias` - Crear aprobación
- `GET /comunicaciones` - Listar comunicaciones

### ms-notificaciones
- `POST /notificaciones` - Enviar notificación manual
- `POST /notificaciones/automaticas` - Configurar notificación automática
- `GET /notificaciones/historial` - Ver historial

## Monitoreo

### CloudWatch Logs
Los logs de cada función Lambda están disponibles en CloudWatch:
- `/aws/lambda/ms-inmuebles-dev-*`
- `/aws/lambda/ms-cuotas-dev-*`
- `/aws/lambda/ms-gastos-dev-*`
- `/aws/lambda/ms-junta-dev-*`
- `/aws/lambda/ms-notificaciones-dev-*`

### EventBridge
Los eventos entre microservicios se pueden monitorear en:
- AWS EventBridge Console > Event buses > condominio-events

## Troubleshooting

### Error de conexión a base de datos
- Verificar variables de entorno DB_*
- Confirmar que PostgreSQL esté ejecutándose
- Verificar permisos de red en AWS RDS

### Error de permisos AWS
- Verificar configuración de AWS CLI
- Confirmar permisos IAM para Lambda, EventBridge, S3, DynamoDB

### Error en despliegue
- Verificar que Serverless Framework esté instalado
- Confirmar región AWS configurada
- Revisar logs de CloudFormation en AWS Console 