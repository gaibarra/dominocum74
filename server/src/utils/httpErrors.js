export const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const badRequestError = (message) => httpError(400, message);
export const unauthorizedError = (message) => httpError(401, message);
export const forbiddenError = (message) => httpError(403, message);
export const notFoundError = (message) => httpError(404, message);
export const conflictError = (message) => httpError(409, message);
