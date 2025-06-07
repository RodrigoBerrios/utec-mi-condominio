# Mi Condominio - Sistema de Microservicios

Sistema de gestión de condominios desarrollado con arquitectura de microservicios para AWS Lambda.

## Arquitectura

El sistema está compuesto por 5 microservicios independientes:

- **ms-inmuebles**: Gestión de inmuebles y juntas de propietarios
- **ms-cuotas**: Gestión de cuotas mensuales y estado de cuenta
- **ms-gastos**: Gestión de gastos y presupuestos
- **ms-junta**: Gestión de aprobaciones y comunicaciones
- **ms-notificaciones**: Sistema de notificaciones automatizadas

## Tecnologías

- **Runtime**: Node.js 18+ con TypeScript
- **Despliegue**: AWS Lambda con Serverless Framework
- **Base de Datos**: 
  - Aurora PostgreSQL (ms-inmuebles, ms-cuotas, ms-gastos, ms-junta)
  - DynamoDB (ms-notificaciones)
- **Comunicación**: AWS EventBridge para eventos entre microservicios
- **Almacenamiento**: S3 para comprobantes de gastos

## Comunicación entre Microservicios

### EventBridge Events

1. **ms-cuotas → ms-notificaciones** (CRON)
   - Evento: `cuota.vencida`
   - Dispara alertas automáticas para cuotas vencidas

2. **ms-junta → ms-gastos** 
   - Evento: `gasto.extraordinario.aprobado`
   - Registra gastos aprobados en el sistema de gastos

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar todos los microservicios
npm run build

# Ejecutar tests
npm run test

# Desplegar todos los microservicios
npm run deploy
```

## Estructura de Directorios

```
MiCondominio/
├── ms-inmuebles/           # Microservicio de inmuebles
├── ms-cuotas/              # Microservicio de cuotas
├── ms-gastos/              # Microservicio de gastos
├── ms-junta/               # Microservicio de junta
├── ms-notificaciones/      # Microservicio de notificaciones
├── package.json            # Configuración del workspace
└── README.md              # Este archivo
```

## Configuración de AWS

Cada microservicio incluye su propio archivo `serverless.yml` configurado para:
- AWS Lambda con runtime Node.js 18
- API Gateway para endpoints REST
- IAM roles con permisos mínimos necesarios
- Variables de entorno para configuración de BD
- EventBridge para comunicación entre servicios

## Desarrollo Individual por Microservicio

Cada microservicio puede desarrollarse y desplegarse independientemente:

```bash
cd ms-inmuebles
npm install
npm run dev      # Desarrollo local
npm run build    # Compilación
npm run deploy   # Despliegue individual
``` 