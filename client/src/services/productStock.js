export const getProductStockQuantity = (product) => {
  const quantity = Number(product?.stockQuantity);
  if (Number.isSafeInteger(quantity) && quantity >= 0) return quantity;
  return (product?.stockStatus || product?.stokStatus) === 'Tersedia' ? 1 : 0;
};
