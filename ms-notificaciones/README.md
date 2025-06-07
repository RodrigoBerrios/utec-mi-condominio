# Microservicio de Notificaciones

Microservicio para el sistema de notificaciones automatizadas del condominio. Maneja el envío de notificaciones por email y la gestión de configuraciones automáticas.

## Funcionalidades

### Endpoints REST

#### 1. Crear Notificación Manual
- **Endpoint**: `POST /notificaciones`
- **Descripción**: Enviar notificación manual
- **Tabla Impactada**: NotificacionesTable

**Ejemplo de Request:**
```json
{
  "tipo": "email",
  "destinatario": "usuario@email.com",
  "asunto": "Mensaje importante",
  "mensaje": "Este es el contenido de la notificación",
  "metadata": {
    "origen": "administracion",
    "prioridad": "alta"
  }
}
```

#### 2. Configurar Notificación Automática
- **Endpoint**: `POST /notificaciones/automaticas`
- **Descripción**: Programar envío automático de alertas
- **Tabla Impactada**: NotificacionesTable

**Ejemplo de Request:**
```json
{
  "tipo": "cuota_vencida",
  "configuracion": {
    "diasAntes": 7,
    "frecuencia": "diaria",
    "activa": true
  }
}
```

#### 3. Obtener Historial de Notificaciones
- **Endpoint**: `GET /notificaciones/historial`
- **Descripción**: Ver historial de notificaciones enviadas
- **Tabla Impactada**: NotificacionesTable

**Parámetros de Query:**
- `usuarioId` (opcional): Filtrar por usuario específico
- `limite` (opcional): Número máximo de resultados (1-100, default: 50)

**Ejemplo**: `GET /notificaciones/historial?usuarioId=user123&limite=25`

#### 4. Obtener Configuraciones
- **Endpoint**: `GET /notificaciones/configuraciones`
- **Descripción**: Obtener configuraciones automáticas activas
- **Tabla Impactada**: NotificacionesTable

### Eventos Automáticos

El microservicio escucha eventos de EventBridge para notificaciones automáticas:

#### 1. Cuota Vencida
- **Fuente**: ms-cuotas
- **Tipo de Evento**: "Cuota Vencida"
- **Handler**: `handleCuotaVencida`

#### 2. Recordatorio de Pago
- **Fuente**: ms-cuotas
- **Tipo de Evento**: "Recordatorio Pago"
- **Handler**: `handleRecordatorioPago`

## Configuración

### Variables de Entorno

```bash
AWS_REGION=us-east-1
DYNAMODB_TABLE=ms-notificaciones-dev-notificaciones
EVENTBRIDGE_BUS=condominio-events
FROM_EMAIL=noreply@micondominio.com
```

### Permisos IAM Requeridos

- DynamoDB: Query, Scan, GetItem, PutItem, UpdateItem, DeleteItem
- SES: SendEmail, SendRawEmail
- EventBridge: Recibir eventos del bus de eventos

## Estructura del Proyecto

```
src/
├── config/
│   └── dynamodb.ts          # Configuración de DynamoDB
├── handlers/
│   ├── events.ts            # Handlers para eventos automáticos
│   └── notificaciones.ts    # Handlers para endpoints REST
├── services/
│   └── notificacionService.ts # Lógica de negocio principal
├── types/
│   └── notificacion.ts      # Schemas y tipos TypeScript
└── utils/
    └── responses.ts         # Utilidades para respuestas HTTP
```

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev

# Desplegar a AWS
npm run deploy

# Ejecutar tests
npm run test
```

## Esquema de Base de Datos

### Tabla: NotificacionesTable

**Clave Primaria:**
- `notificacionId` (String): ID único de la notificación

**Índices Globales Secundarios:**
- `UsuarioIndex`: `destinatario` (Hash) + `fechaCreacion` (Range)
- `FechaCreacionIndex`: `fechaCreacion` (Hash)

**Atributos:**
- `notificacionId`: ID único generado automáticamente
- `tipo`: Tipo de notificación (email, sms, push)
- `destinatario`: Email o ID del destinatario
- `asunto`: Asunto de la notificación
- `mensaje`: Contenido del mensaje
- `estado`: Estado actual (pendiente, enviado, fallido)
- `fechaCreacion`: Timestamp de creación
- `fechaEnvio`: Timestamp de envío (opcional)
- `metadata`: Información adicional (opcional)

## Tipos de Notificaciones Automáticas

1. **cuota_vencida**: Notificaciones cuando una cuota está vencida
2. **recordatorio_pago**: Recordatorios antes del vencimiento
3. **comunicado_general**: Comunicados generales del condominio

## Integración con SES

El microservicio utiliza Amazon SES para el envío de emails. Las notificaciones se envían tanto en formato texto plano como HTML.

**Configuración requerida en SES:**
- Verificar el dominio de envío
- Configurar el email `FROM_EMAIL` como direccion verificada
- Salir del sandbox de SES para envío a emails no verificados (producción)

## Ejemplo de Uso

### Enviar Notificación Manual

```bash
curl -X POST https://api.micondominio.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "email",
    "destinatario": "residente@email.com",
    "asunto": "Comunicado Importante",
    "mensaje": "Se informa que mañana habrá corte de agua por mantenimiento."
  }'
```

### Configurar Recordatorio Automático

```bash
curl -X POST https://api.micondominio.com/notificaciones/automaticas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "recordatorio_pago",
    "configuracion": {
      "diasAntes": 5,
      "frecuencia": "diaria",
      "activa": true
    }
  }'
``` 