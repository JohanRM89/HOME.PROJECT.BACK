// ============================================================
// Vista — capa de presentación de respuestas HTTP (SOLID: SRP)
// Centraliza el formato de todas las respuestas de la API
// ============================================================
class ResponseView {
  static success(res, data = null, message = 'Operación exitosa', status = 200) {
    return res.status(status).json({
      ok:      true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Recurso creado correctamente') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'Error interno', status = 500, errors = null) {
    const body = { ok: false, message };
    if (errors) body.errors = errors;
    return res.status(status).json(body);
  }

  static validationError(res, errors) {
    return this.error(res, 'Error de validación', 422, errors);
  }

  static notFound(res, message = 'Recurso no encontrado') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'No autorizado') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Acceso denegado') {
    return this.error(res, message, 403);
  }

  static paginated(res, { data, total, page, totalPages }, message = 'OK') {
    return res.status(200).json({
      ok:      true,
      message,
      data,
      meta: { total, page, totalPages },
    });
  }
}

module.exports = ResponseView;
