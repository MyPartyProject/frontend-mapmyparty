const CASHFREE_CHECKOUT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

let cashfreeScriptPromise = null;

export const loadCashfreeScript = () => {
  if (window.Cashfree) {
    return Promise.resolve(true);
  }

  if (cashfreeScriptPromise) {
    return cashfreeScriptPromise;
  }

  cashfreeScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${CASHFREE_CHECKOUT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Cashfree Checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CASHFREE_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Cashfree Checkout"));
    document.body.appendChild(script);
  });

  return cashfreeScriptPromise;
};

export default loadCashfreeScript;
