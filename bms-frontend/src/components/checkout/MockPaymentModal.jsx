/**
 * Stand-in for Razorpay Checkout, shown only when the backend runs without Razorpay keys
 * (provider === "mock"). Lets you click through the whole booking flow locally.
 */
const MockPaymentModal = ({ amountPaise, onPay, onFail, onClose, busy }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
      <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block mb-3">
        TEST MODE — no real money
      </p>
      <h3 className="text-lg font-semibold">Mock payment gateway</h3>
      <p className="text-3xl font-bold my-4">₹{(amountPaise / 100).toFixed(2)}</p>
      <p className="text-sm text-gray-500 mb-5">
        Razorpay keys are not configured on the server, so this local gateway simulates the payment.
      </p>
      <div className="flex flex-col gap-2">
        <button
          disabled={busy}
          onClick={onPay}
          className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Processing..." : "Simulate successful payment"}
        </button>
        <button
          disabled={busy}
          onClick={onFail}
          className="border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg font-medium disabled:opacity-60 cursor-pointer"
        >
          Simulate failed payment
        </button>
        <button disabled={busy} onClick={onClose} className="text-sm text-gray-500 underline mt-1 cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default MockPaymentModal;
