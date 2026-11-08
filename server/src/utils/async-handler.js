/** Adapta controladores async a Express 4 y delega errores al middleware central. */
export const asyncHandler = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
