# Microservicios del Sistema de Condominio

Este documento describe todos los microservicios implementados para el sistema de gestión de condominios.

## Microservicios Implementados

### 1. ms-inmuebles
**Descripción**: Gestión de inmuebles y juntas directivas
**Puerto**: 3001

#### Endpoints:
- `POST /inmuebles` - Crear inmueble
- `GET /inmuebles` - Listar inmuebles
- `POST /juntas` - Crear junta directiva
- `GET /juntas` - Listar juntas directivas

### 2. ms-cuotas
**Descripción**: Gestión de cuotas de mantenimiento
**Puerto**: 3002

#### Endpoints:
- `POST /cuotas` - Crear cuota
- `GET /cuotas` - Listar cuotas
- `PUT /cuotas/{cuotaId}/estado` - Actualizar estado de cuota

### 3. ms-gastos
**Descripción**: Gestión de gastos y presupuestos
**Puerto**: 3003

#### Endpoints:
- `POST /gastos` - Crear gasto
- `GET /gastos` - Listar gastos (filtros: categoria, fechaInicio, fechaFin)
- `POST /gastos/comprobantes` - Subir comprobante de gasto
- `GET /gastos/comprobantes` - Obtener comprobantes (query: gastoId)
- `GET /gastos/resumen` - Obtener resumen de gastos vs presupuesto (query: periodo)

### 4. ms-junta
**Descripción**: Gestión de juntas directivas, aprobaciones y comunicaciones
**Puerto**: 3004

#### Endpoints:
- `POST /aprobaciones-extraordinarias` - Crear aprobación extraordinaria
- `GET /comunicaciones` - Listar comunicaciones (filtros: tipo, estado)
- `POST /comunicaciones` - Crear comunicación

### 5. ms-pagos
**Descripción**: Gestión de pagos de cuotas
**Puerto**: 3005

#### Endpoints:
- `POST /pagos` - Crear pago
- `GET /pagos` - Listar pagos (filtros: cuotaId, estado)
- `GET /pagos/{pagoId}` - Obtener pago específico
- `PUT /pagos/{pagoId}/estado` - Actualizar estado de pago

### 6. ms-notificaciones
**Descripción**: Gestión de notificaciones del sistema
**Puerto**: 3006

#### Endpoints:
- `POST /notificaciones` - Crear notificación
- `GET /notificaciones` - Listar notificaciones

## Estructura de Archivos

Cada microservicio sigue la siguiente estructura:

```
ms-{nombre}/
├── package.json
├── tsconfig.json
├── serverless.yml
└── src/
    ├── config/
    │   └── database.ts
    ├── types/
    │   └── {entidad}.ts
    ├── services/
    │   └── {entidad}Service.ts
    ├── handlers/
    │   └── {entidad}.ts
    └── utils/
        └── response.ts
```

## Tecnologías Utilizadas

- **Runtime**: Node.js 18.x
- **Framework**: Serverless Framework
- **Base de Datos**: PostgreSQL
- **Validación**: Zod
- **Cloud Provider**: AWS Lambda
- **Almacenamiento**: AWS S3 (para comprobantes)
- **Eventos**: AWS EventBridge

## Variables de Entorno

Cada microservicio requiere las siguientes variables de entorno:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=condominio_db
DB_USER=postgres
DB_PASSWORD=password
S3_BUCKET=condominio-comprobantes
EVENTBRIDGE_BUS=condominio-events
```

## Comandos de Desarrollo

Para cada microservicio:

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Deploy a desarrollo
npm run deploy:dev

# Deploy a producción
npm run deploy:prod
```

## Características Implementadas

### Validación de Datos
- Todos los endpoints utilizan Zod para validación de entrada
- Respuestas estandarizadas con formato JSON consistente
- Manejo de errores centralizado

### Base de Datos
- Pool de conexiones PostgreSQL optimizado
- Queries parametrizadas para prevenir SQL injection
- Logging de queries para debugging

### Seguridad
- CORS habilitado para todos los endpoints
- Headers de seguridad configurados
- Validación de parámetros de entrada

### Escalabilidad
- Arquitectura serverless con AWS Lambda
- Auto-scaling automático
- Separación de responsabilidades por dominio

## Próximos Pasos

1. Implementar autenticación y autorización
2. Agregar tests unitarios e integración
3. Configurar CI/CD pipeline
4. Implementar monitoreo y logging centralizado
5. Agregar documentación OpenAPI/Swagger 