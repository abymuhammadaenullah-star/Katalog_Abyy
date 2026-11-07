export const DEFAULT_PRODUCT_IMAGE = '/product-default.svg';

export const getProductImageUrl = (product) => {
  const image = product?.image || product?.imageUrl || product?.image_url;
  if (!image || image === '-' || image === 'null') return DEFAULT_PRODUCT_IMAGE;
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return image.startsWith('/') ? image : `/${image}`;
};
