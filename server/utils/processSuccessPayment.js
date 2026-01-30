async function processSuccessfulPayment(payment, buyerId, paymentReference, options = {}) {
  // payment.products and payment.sellers are arrays (single product -> length 1)
  const products = Array.isArray(payment.products) ? payment.products : [payment.products];
  const sellers = Array.isArray(payment.sellers) ? payment.sellers : [payment.sellers];

  // For Stripe multi-step: we use stripe.transfers using payment.stripeTransferGroup
  const stripeIntent = options.stripeIntent;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const seller = sellers[i];

    // Amount to credit (we assume full amount to seller for simplicity; you may apply platform fees)
    const sellerAmount = product.amount;

    // if seller has connected Razorpay -> existing flow (you already do increment balance)
    if (seller.razorpayAccountId && payment.currency === "INR") {
      // same as earlier
      await User.findByIdAndUpdate(seller._id, { $inc: { balance: sellerAmount } });
    } else if (seller.stripeAccountId && stripeIntent) {
      // Create a transfer to connected stripe account in smallest currency unit
      try {
        // convert amount to cents of stripeIntent.currency
        const cents = Math.round(product.amount * 100);
        await stripe.transfers.create({
          amount: cents,
          currency: stripeIntent.currency,
          destination: seller.stripeAccountId,
          transfer_group: payment.stripeTransferGroup || undefined,
          metadata: { paymentId: payment._id.toString(), productId: product._id.toString() }
        });
      } catch (err) {
        console.error("Stripe transfer failed for seller", seller._id, err);
        // fallback: credit platform balance and create wallet transaction for later manual payout
        await User.findByIdAndUpdate(seller._id, { $inc: { balance: sellerAmount } });
      }
    } else {
      // No connected account -> credit platform wallet (your existing behavior)
      await User.findByIdAndUpdate(seller._id, { $inc: { balance: sellerAmount } });
    }

    // Create WalletTransaction for seller
    const buyer = await User.findById(buyerId).select("name email handle");
    await WalletTransaction.create({
      user: seller._id,
      type: "CREDIT",
      amount: sellerAmount,
      reference: paymentReference,
      status: "SUCCESS",
      product: {
        _id: product._id,
        name: product.name,
        amount: product.amount,
        image: product.image?.[0] || "",
      },
      purchasedBy: buyer ? { handle: buyer.handle, name: buyer.name, email: buyer.email } : null,
    });

    // Create buyer Order record
    await Order.create({
      user: buyerId,
      product: product._id,
      amount: product.amount,
      status: "paid",
    });

    // Send mail + Notifications - reuse your existing code
    // ... copy the sections from capturePayment for sending emails/notifications
  }
}
