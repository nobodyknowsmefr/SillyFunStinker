import React, { useRef, useEffect } from 'react';
import { isShopifyConfigured, initShopifyBuyButton } from '../logic/shopifyBuyButton';

export default function ProductSection() {
  const buyButtonRef = useRef(null);
  const shopifyReady = isShopifyConfigured();

  useEffect(() => {
    if (shopifyReady && buyButtonRef.current) {
      initShopifyBuyButton(buyButtonRef.current);
    }
  }, [shopifyReady]);

  return (
    <div className="product-section">
      <h3 className="product-section__title">Shape Necklace Kit</h3>
      <p className="product-section__tagline">Harvested. Processed. Sequenced. Yours.</p>

      <div className="product-section__price">$24.99</div>
      <p className="product-section__price-note">
        Price includes prophecy. Sequence randomized at fulfillment.
      </p>

      <div className="product-section__buy-container" ref={buyButtonRef}>
        {!shopifyReady && (
          <p className="product-section__buy-placeholder">
            [ Shopify Buy Button ]
          </p>
        )}
      </div>

      <p className="product-section__note">
        All kits contain 25 official pieces + 1 rope.
        Sequence order makes each necklace unique.
      </p>
    </div>
  );
}
