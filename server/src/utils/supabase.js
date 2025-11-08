const { createHttpError } = require("./httpError");

function unwrap(result, { notFoundMessage = "Resource not found", notFoundStatus = 404 } = {}) {
  if (result.error) {
    throw createHttpError(500, result.error.message, {
      hint: result.error.hint,
      details: result.error.details,
    });
  }

  if (Object.prototype.hasOwnProperty.call(result, "data")) {
    const { data } = result;
    if (data === null || data === undefined) {
      throw createHttpError(notFoundStatus, notFoundMessage);
    }
    return data;
  }

  return result;
}

module.exports = { unwrap };

