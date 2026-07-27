export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export const sendSuccess = (res, { statusCode = 200, data = null, message = "Success", meta } = {}) => {
  const body = new ApiResponse(statusCode, data, message);
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};
