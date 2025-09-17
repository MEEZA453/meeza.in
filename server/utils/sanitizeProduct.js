export const sanitizeProduct = (product) => {
  const { driveLink, ...rest } = product;
  return rest;
};