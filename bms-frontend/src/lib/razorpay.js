const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads Razorpay's Checkout script once (it is not an npm package, it is served by Razorpay). */
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
