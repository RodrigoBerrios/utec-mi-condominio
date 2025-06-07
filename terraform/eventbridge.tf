# EventBridge Custom Bus
resource "aws_cloudwatch_event_bus" "main" {
  name = "${local.name_prefix}-events"

  tags = local.common_tags
}

# EventBridge Rules para diferentes tipos de eventos

# Regla para eventos de cuotas vencidas
resource "aws_cloudwatch_event_rule" "cuota_vencida" {
  name           = "${local.name_prefix}-cuota-vencida"
  description    = "Procesa eventos de cuotas vencidas"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source      = ["mi-condominio.cuotas"]
    detail-type = ["Cuota Vencida"]
  })

  tags = local.common_tags
}

# Target para eventos de cuotas vencidas -> microservicio de notificaciones
resource "aws_cloudwatch_event_target" "cuota_vencida_notifications" {
  rule           = aws_cloudwatch_event_rule.cuota_vencida.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "NotificationsTarget"
  arn            = aws_lambda_function.microservice["notificaciones"].arn

  input_transformer {
    input_paths = {
      cuota_id    = "$.detail.cuota_id"
      usuario_id  = "$.detail.usuario_id"
      monto       = "$.detail.monto"
      fecha_venc  = "$.detail.fecha_vencimiento"
    }
    input_template = <<EOF
{
  "type": "cuota_vencida",
  "data": {
    "cuota_id": "<cuota_id>",
    "usuario_id": "<usuario_id>",
    "monto": "<monto>",
    "fecha_vencimiento": "<fecha_venc>"
  }
}
EOF
  }
}

# Regla para eventos de gastos extraordinarios aprobados
resource "aws_cloudwatch_event_rule" "gasto_extraordinario_aprobado" {
  name           = "${local.name_prefix}-gasto-extraordinario-aprobado"
  description    = "Procesa eventos de gastos extraordinarios aprobados"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source      = ["mi-condominio.junta"]
    detail-type = ["Gasto Extraordinario Aprobado"]
  })

  tags = local.common_tags
}

# Target para gastos extraordinarios aprobados -> microservicio de gastos
resource "aws_cloudwatch_event_target" "gasto_extraordinario_gastos" {
  rule           = aws_cloudwatch_event_rule.gasto_extraordinario_aprobado.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "GastosTarget"
  arn            = aws_lambda_function.microservice["gastos"].arn

  input_transformer {
    input_paths = {
      gasto_id     = "$.detail.gasto_id"
      descripcion  = "$.detail.descripcion"
      monto        = "$.detail.monto"
      categoria    = "$.detail.categoria"
      aprobado_por = "$.detail.aprobado_por"
    }
    input_template = <<EOF
{
  "type": "gasto_extraordinario_aprobado",
  "data": {
    "gasto_id": "<gasto_id>",
    "descripcion": "<descripcion>",
    "monto": "<monto>",
    "categoria": "<categoria>",
    "aprobado_por": "<aprobado_por>"
  }
}
EOF
  }
}

# Regla para eventos de pagos procesados
resource "aws_cloudwatch_event_rule" "pago_procesado" {
  name           = "${local.name_prefix}-pago-procesado"
  description    = "Procesa eventos de pagos procesados"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source      = ["mi-condominio.pagos"]
    detail-type = ["Pago Procesado"]
  })

  tags = local.common_tags
}

# Target para pagos procesados -> microservicio de cuotas
resource "aws_cloudwatch_event_target" "pago_procesado_cuotas" {
  rule           = aws_cloudwatch_event_rule.pago_procesado.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "CuotasTarget"
  arn            = aws_lambda_function.microservice["cuotas"].arn

  input_transformer {
    input_paths = {
      pago_id    = "$.detail.pago_id"
      cuota_id   = "$.detail.cuota_id"
      monto      = "$.detail.monto"
      fecha_pago = "$.detail.fecha_pago"
      metodo     = "$.detail.metodo_pago"
    }
    input_template = <<EOF
{
  "type": "pago_procesado",
  "data": {
    "pago_id": "<pago_id>",
    "cuota_id": "<cuota_id>",
    "monto": "<monto>",
    "fecha_pago": "<fecha_pago>",
    "metodo_pago": "<metodo>"
  }
}
EOF
  }
}

# Target para pagos procesados -> microservicio de notificaciones
resource "aws_cloudwatch_event_target" "pago_procesado_notifications" {
  rule           = aws_cloudwatch_event_rule.pago_procesado.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "NotificationsTargetPago"
  arn            = aws_lambda_function.microservice["notificaciones"].arn

  input_transformer {
    input_paths = {
      pago_id    = "$.detail.pago_id"
      usuario_id = "$.detail.usuario_id"
      monto      = "$.detail.monto"
      fecha_pago = "$.detail.fecha_pago"
    }
    input_template = <<EOF
{
  "type": "pago_confirmado",
  "data": {
    "pago_id": "<pago_id>",
    "usuario_id": "<usuario_id>",
    "monto": "<monto>",
    "fecha_pago": "<fecha_pago>"
  }
}
EOF
  }
}

# EventBridge Rule para eventos programados (CRON)
resource "aws_cloudwatch_event_rule" "daily_check" {
  name                = "${local.name_prefix}-daily-check"
  description         = "Ejecuta verificaciones diarias"
  schedule_expression = "cron(0 9 * * ? *)" # Todos los días a las 9 AM UTC

  tags = local.common_tags
}

# Target para verificaciones diarias -> microservicio de cuotas
resource "aws_cloudwatch_event_target" "daily_check_cuotas" {
  rule      = aws_cloudwatch_event_rule.daily_check.name
  target_id = "DailyCheckCuotas"
  arn       = aws_lambda_function.microservice["cuotas"].arn

  input = jsonencode({
    type = "daily_check"
    action = "verificar_cuotas_vencidas"
  })
}

# Permisos para que EventBridge invoque las Lambda functions
resource "aws_lambda_permission" "eventbridge_cuota_vencida" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice["notificaciones"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cuota_vencida.arn
}

resource "aws_lambda_permission" "eventbridge_gasto_extraordinario" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice["gastos"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.gasto_extraordinario_aprobado.arn
}

resource "aws_lambda_permission" "eventbridge_pago_procesado_cuotas" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice["cuotas"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pago_procesado.arn
}

resource "aws_lambda_permission" "eventbridge_pago_procesado_notifications" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice["notificaciones"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pago_procesado.arn
}

resource "aws_lambda_permission" "eventbridge_daily_check" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice["cuotas"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_check.arn
}

# CloudWatch Log Group para EventBridge
resource "aws_cloudwatch_log_group" "eventbridge" {
  name              = "/aws/events/${local.name_prefix}"
  retention_in_days = 14
  tags              = local.common_tags
}

# Outputs
output "eventbridge_bus_arn" {
  description = "ARN of the EventBridge custom bus"
  value       = aws_cloudwatch_event_bus.main.arn
}

output "eventbridge_bus_name" {
  description = "Name of the EventBridge custom bus"
  value       = aws_cloudwatch_event_bus.main.name
} 