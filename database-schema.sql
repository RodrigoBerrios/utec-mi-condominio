-- =====================================================
-- ESQUEMA DE BASE DE DATOS - MI CONDOMINIO
-- =====================================================
-- Base de datos PostgreSQL para microservicios:
-- ms-inmuebles, ms-cuotas, ms-gastos, ms-junta, ms-inmobiliarias
-- =====================================================

-- Tabla para ms-inmobiliarias
CREATE TABLE IF NOT EXISTS inmobiliarias (
    inmobiliaria_id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    sitio_web VARCHAR(255),
    licencia VARCHAR(100),
    fecha_fundacion DATE,
    estado VARCHAR(20) CHECK (estado IN ('activa', 'inactiva', 'suspendida')) DEFAULT 'activa',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para ms-inmuebles
CREATE TABLE IF NOT EXISTS inmuebles (
    inmueble_id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('edificio', 'condominio')) NOT NULL,
    inmobiliaria_id VARCHAR(36), -- Nueva relación con inmobiliarias
    junta_id VARCHAR(36),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (inmobiliaria_id) REFERENCES inmobiliarias(inmobiliaria_id)
);

-- Tabla para ms-inmuebles (juntas de propietarios)
CREATE TABLE IF NOT EXISTS juntas (
    junta_id VARCHAR(36) PRIMARY KEY,
    inmueble_id VARCHAR(36) NOT NULL,
    miembros JSONB NOT NULL, -- Array de IDs de miembros
    periodo VARCHAR(7) NOT NULL, -- Formato YYYY-MM
    estado VARCHAR(20) CHECK (estado IN ('activa', 'inactiva')) NOT NULL,
    FOREIGN KEY (inmueble_id) REFERENCES inmuebles(inmueble_id)
);

-- Tabla para ms-cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    cuota_id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    inmueble_id VARCHAR(36) NOT NULL,
    periodo VARCHAR(7) NOT NULL, -- Formato YYYY-MM
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'pagado', 'vencido')) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (inmueble_id) REFERENCES inmuebles(inmueble_id)
);

-- Tabla para ms-gastos
CREATE TABLE IF NOT EXISTS gastos (
    gasto_id VARCHAR(36) PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    categoria VARCHAR(30) CHECK (categoria IN ('mantenimiento', 'servicios', 'seguridad', 'limpieza', 'extraordinario')) NOT NULL,
    fecha_gasto DATE NOT NULL,
    proveedor VARCHAR(255),
    comprobantes JSONB, -- Array de URLs de S3
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')) DEFAULT 'pendiente',
    aprobado_por VARCHAR(36),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para ms-gastos (presupuestos)
CREATE TABLE IF NOT EXISTS presupuestos (
    presupuesto_id VARCHAR(36) PRIMARY KEY,
    categoria VARCHAR(30) NOT NULL,
    monto_asignado DECIMAL(10,2) NOT NULL CHECK (monto_asignado > 0),
    monto_gastado DECIMAL(10,2) DEFAULT 0 CHECK (monto_gastado >= 0),
    periodo VARCHAR(7) NOT NULL -- Formato YYYY-MM
);

-- Tabla para ms-junta (aprobaciones)
CREATE TABLE IF NOT EXISTS aprobaciones (
    aprobacion_id VARCHAR(36) PRIMARY KEY,
    gasto_id VARCHAR(36) NOT NULL,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    categoria VARCHAR(30) NOT NULL,
    solicitado_por VARCHAR(36) NOT NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')) DEFAULT 'pendiente',
    aprobado_por VARCHAR(36),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    comentarios TEXT,
    votos_a_favor INTEGER DEFAULT 0 CHECK (votos_a_favor >= 0),
    votos_en_contra INTEGER DEFAULT 0 CHECK (votos_en_contra >= 0),
    votos_requeridos INTEGER DEFAULT 3 CHECK (votos_requeridos > 0)
);

-- Tabla para ms-junta (comunicaciones)
CREATE TABLE IF NOT EXISTS comunicaciones (
    comunicacion_id VARCHAR(36) PRIMARY KEY,
    tipo VARCHAR(20) CHECK (tipo IN ('comunicado', 'convocatoria', 'acta')) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    publicado_por VARCHAR(36) NOT NULL,
    destinatarios JSONB, -- Array de IDs, si está vacío es para todos
    adjuntos JSONB, -- Array de URLs
    estado VARCHAR(20) CHECK (estado IN ('borrador', 'publicado', 'archivado')) DEFAULT 'borrador'
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para inmobiliarias
CREATE INDEX IF NOT EXISTS idx_inmobiliarias_ruc ON inmobiliarias(ruc);
CREATE INDEX IF NOT EXISTS idx_inmobiliarias_estado ON inmobiliarias(estado);
CREATE INDEX IF NOT EXISTS idx_inmobiliarias_nombre ON inmobiliarias(nombre);

-- Índices para inmuebles
CREATE INDEX IF NOT EXISTS idx_inmuebles_tipo ON inmuebles(tipo);
CREATE INDEX IF NOT EXISTS idx_inmuebles_junta ON inmuebles(junta_id);
CREATE INDEX IF NOT EXISTS idx_inmuebles_inmobiliaria ON inmuebles(inmobiliaria_id);

-- Índices para juntas
CREATE INDEX IF NOT EXISTS idx_juntas_inmueble ON juntas(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_juntas_periodo ON juntas(periodo);
CREATE INDEX IF NOT EXISTS idx_juntas_estado ON juntas(estado);

-- Índices para cuotas
CREATE INDEX IF NOT EXISTS idx_cuotas_usuario ON cuotas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_inmueble ON cuotas(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_periodo ON cuotas(periodo);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento ON cuotas(fecha_vencimiento);

-- Índices para gastos
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_estado ON gastos(estado);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha_gasto);

-- Índices para presupuestos
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria ON presupuestos(categoria);
CREATE INDEX IF NOT EXISTS idx_presupuestos_periodo ON presupuestos(periodo);

-- Índices para aprobaciones
CREATE INDEX IF NOT EXISTS idx_aprobaciones_gasto ON aprobaciones(gasto_id);
CREATE INDEX IF NOT EXISTS idx_aprobaciones_estado ON aprobaciones(estado);
CREATE INDEX IF NOT EXISTS idx_aprobaciones_solicitado ON aprobaciones(solicitado_por);

-- Índices para comunicaciones
CREATE INDEX IF NOT EXISTS idx_comunicaciones_tipo ON comunicaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_estado ON comunicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_fecha ON comunicaciones(fecha_publicacion);

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar inmobiliaria de ejemplo
INSERT INTO inmobiliarias (inmobiliaria_id, nombre, razon_social, ruc, direccion, telefono, email, sitio_web, licencia, fecha_fundacion, estado)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Inmobiliaria Los Jardines',
    'Inmobiliaria Los Jardines S.A.C.',
    '20123456789',
    'Av. Comercial 456, San Isidro, Lima',
    '+51 1 234-5678',
    'contacto@losjardines.com.pe',
    'https://www.losjardines.com.pe',
    'LIC-2024-001',
    '2020-01-15',
    'activa'
) ON CONFLICT (inmobiliaria_id) DO NOTHING;

-- Insertar inmueble de ejemplo
INSERT INTO inmuebles (inmueble_id, nombre, direccion, tipo, inmobiliaria_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Edificio Los Pinos', 'Av. Principal 123, Lima', 'edificio', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (inmueble_id) DO UPDATE SET inmobiliaria_id = EXCLUDED.inmobiliaria_id;

-- Insertar junta de ejemplo
INSERT INTO juntas (junta_id, inmueble_id, miembros, periodo, estado)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '["user1", "user2", "user3"]',
    '2024-01',
    'activa'
) ON CONFLICT (junta_id) DO NOTHING; 