// src/modules/cart.ts
// Full-page cart only. Adds items via AJAX then redirects to /cart.

import type { ShopifyCart } from '../types/shopify';
import { CartAPI } from '../utils/api';
import { $, $$ } from '../utils/dom';

class CartManager {
  private countEls = $$<HTMLElement>('#CartCount, #MtbCartCount, #DockCartCount');

  constructor() {
    void this.syncCount();
    this.bindAtc();
    this.bindBuyNow();
    this.bindCartPage();
  }

  // ------------------------------------------------------------------
  // Buy Now — AJAX add to cart with correct qty, then go to /checkout
  // ------------------------------------------------------------------
  private bindBuyNow(): void {
    document.addEventListener('click', async (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('[data-buy-now]');
      if (!btn) return;

      const variantId = Number(btn.dataset.variantId);
      if (!variantId) return;

      // Read qty from the PDP stepper (same as ATC)
      const form = btn.closest('form') ?? document.querySelector<HTMLFormElement>('#ProductForm');
      const qtyInput = form?.querySelector<HTMLInputElement>('input[name="quantity"]');
      const quantity = Math.max(1, parseInt(qtyInput?.value ?? '1', 10));

      btn.disabled = true;
      btn.textContent = 'Processing…';

      try {
        await CartAPI.add({ id: variantId, quantity });
        // Redirect cleanly — Shopify builds the correct checkout session from cart
        window.location.href = '/checkout';
      } catch (err) {
        console.error('[Cart] Buy Now failed:', err);
        btn.disabled = false;
        btn.textContent = 'Buy Now';
      }
    });
  }

  // ------------------------------------------------------------------
  // Sync badge count from live cart
  // ------------------------------------------------------------------
  private async syncCount(): Promise<void> {
    try {
      const cart: ShopifyCart = await CartAPI.get();
      this.updateCount(cart.item_count);
    } catch { /* silent */ }
  }

  private updateCount(count: number): void {
    this.countEls.forEach(el => {
      el.textContent = String(count);
      el.classList.toggle('cart-count--hidden', count === 0);
      el.classList.toggle('mtb__cart-badge--hidden', count === 0);
      el.classList.toggle('bdock__badge--hidden', count === 0);
    });
  }

  // ------------------------------------------------------------------
  // Global ATC delegation — reads qty from stepper, adds via AJAX,
  // then navigates to /cart so the full-page cart shows up.
  // ------------------------------------------------------------------
  private bindAtc(): void {
    document.addEventListener('click', async (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('[data-atc]');
      if (!btn) return;

      const variantId = Number(btn.dataset.variantId);
      if (!variantId) return;

      // Read qty from the nearest quantity input in the product form
      const form = btn.closest('form') ?? document.querySelector<HTMLFormElement>('#ProductForm');
      const qtyInput = form?.querySelector<HTMLInputElement>('input[name="quantity"]');
      const quantity = Math.max(1, parseInt(qtyInput?.value ?? '1', 10));

      // Visual feedback
      btn.disabled = true;
      const originalHTML = btn.innerHTML;
      btn.textContent = 'Adding…';

      try {
        await CartAPI.add({ id: variantId, quantity });
        btn.textContent = 'Added ✓';
        // Short pause so user sees confirmation, then go to cart page
        setTimeout(() => {
          window.location.href = '/cart';
        }, 600);
      } catch (err) {
        console.error('[Cart] Add failed:', err);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    });
  }

  // ------------------------------------------------------------------
  // Full-page cart page events delegation (qty stepper & remove button)
  // ------------------------------------------------------------------
  private bindCartPage(): void {
    const isCartPage = window.location.pathname.replace(/\/$/, '') === '/cart';
    if (!isCartPage) return;

    // Delegate clicks on quantity minus, plus, and remove buttons
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // 1. Remove button
      const removeBtn = target.closest<HTMLButtonElement>('[data-cart-remove]');
      if (removeBtn) {
        const key = removeBtn.dataset.cartRemove!;
        removeBtn.disabled = true;
        removeBtn.textContent = 'Removing…';
        try {
          await CartAPI.change({ id: key, quantity: 0 });
          window.location.reload();
        } catch (err) {
          console.error('[Cart] Remove failed:', err);
          removeBtn.disabled = false;
          removeBtn.textContent = 'Remove';
        }
        return;
      }

      // 2. Minus button
      const minusBtn = target.closest<HTMLButtonElement>('[data-cart-qty-minus]');
      if (minusBtn) {
        const key = minusBtn.dataset.cartQtyMinus!;
        const input = document.querySelector<HTMLInputElement>(`[data-qty-input="${key}"]`);
        if (!input) return;
        const currentQty = parseInt(input.value, 10);
        const newQty = Math.max(0, currentQty - 1);
        
        minusBtn.disabled = true;
        try {
          await CartAPI.change({ id: key, quantity: newQty });
          window.location.reload();
        } catch (err) {
          console.error('[Cart] Decrease quantity failed:', err);
          minusBtn.disabled = false;
        }
        return;
      }

      // 3. Plus button
      const plusBtn = target.closest<HTMLButtonElement>('[data-cart-qty-plus]');
      if (plusBtn) {
        const key = plusBtn.dataset.cartQtyPlus!;
        const input = document.querySelector<HTMLInputElement>(`[data-qty-input="${key}"]`);
        if (!input) return;
        const currentQty = parseInt(input.value, 10);
        const newQty = currentQty + 1;

        plusBtn.disabled = true;
        try {
          await CartAPI.change({ id: key, quantity: newQty });
          window.location.reload();
        } catch (err) {
          console.error('[Cart] Increase quantity failed:', err);
          plusBtn.disabled = false;
        }
        return;
      }
    });

    // Handle manual input changes
    document.querySelectorAll<HTMLInputElement>('[data-qty-input]').forEach(input => {
      input.addEventListener('change', async () => {
        const key = input.dataset.qtyInput!;
        const newQty = Math.max(0, parseInt(input.value, 10) || 0);
        input.disabled = true;
        try {
          await CartAPI.change({ id: key, quantity: newQty });
          window.location.reload();
        } catch (err) {
          console.error('[Cart] Manual quantity update failed:', err);
          input.disabled = false;
        }
      });
    });
  }
}

// Initialise
new CartManager();

// Remove legacy global (was used by drawer)
delete (window as Window & { closeCartDrawer?: () => void }).closeCartDrawer;
