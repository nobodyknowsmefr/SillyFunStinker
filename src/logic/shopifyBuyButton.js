/**
 * Shopify Buy Button — wrapper for embedding Shopify buy buttons.
 * 
 * To integrate:
 * 1. Replace SHOPIFY_DOMAIN and STOREFRONT_ACCESS_TOKEN with real values.
 * 2. Replace PRODUCT_ID with the real Shopify product ID.
 * 3. The buy button will render into the container element.
 *
 * This module is isolated from the fortune/cooldown system.
 */

const SHOPIFY_CONFIG = {
  domain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token',
  productId: 'your-product-id',
};

/**
 * Initialize the Shopify Buy Button SDK and render into a container.
 * @param {HTMLElement} containerEl — DOM element to render the button into
 * @param {object} [overrides] — optional config overrides
 */
export function initShopifyBuyButton(containerEl, overrides = {}) {
  const config = { ...SHOPIFY_CONFIG, ...overrides };

  // Check if Shopify Buy SDK is loaded
  if (typeof window.ShopifyBuy === 'undefined') {
    console.warn(
      '[Shape Store] Shopify Buy SDK not loaded. Add the following script to your HTML:\n' +
      '<script src="https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js"></script>'
    );
    return null;
  }

  const client = window.ShopifyBuy.buildClient({
    domain: config.domain,
    storefrontAccessToken: config.storefrontAccessToken,
  });

  window.ShopifyBuy.UI.onReady(client).then((ui) => {
    ui.createComponent('product', {
      id: config.productId,
      node: containerEl,
      moneyFormat: '%24%7B%7Bamount%7D%7D',
      options: {
        product: {
          styles: {
            product: { '@media (min-width: 601px)': { 'max-width': '100%' } },
            button: {
              'background-color': '#E53935',
              ':hover': { 'background-color': '#C62828' },
              'border-radius': '8px',
              'font-family': '"Fredoka One", cursive',
              'font-size': '18px',
              'padding': '12px 24px',
            },
            title: { 'font-family': '"Fredoka One", cursive' },
            price: { 'font-family': '"Comic Neue", cursive', 'font-size': '20px' },
          },
          text: { button: 'Add to Cart' },
        },
        cart: {
          styles: {
            button: {
              'background-color': '#E53935',
              ':hover': { 'background-color': '#C62828' },
              'border-radius': '8px',
              'font-family': '"Fredoka One", cursive',
            },
          },
        },
      },
    });
  });
}

/**
 * Check if Shopify is configured (non-placeholder values).
 */
export function isShopifyConfigured() {
  return (
    SHOPIFY_CONFIG.domain !== 'your-store.myshopify.com' &&
    SHOPIFY_CONFIG.storefrontAccessToken !== 'your-storefront-access-token'
  );
}
