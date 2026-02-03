import Product from "../models/designs.js";
import { calculateProductHotScore } from "./productHotScore.js";

export const updateProductHotScore = async (productId, session = null) => {
  const query = Product.findById(productId).select(
    "views uniqueViewers drip createdAt"
  );

  if (session) query.session(session);

  const product = await query;
  if (!product) return;

  const hotScore = calculateProductHotScore({
    views: product.views || 0,
    uniqueViewers: product.uniqueViewers || 0,
    drip: product.drip || 0,
    createdAt: product.createdAt,
  });

  await Product.findByIdAndUpdate(
    productId,
    {
      hotScore,
      isHot: hotScore > 1.2, // threshold you control
    },
    session ? { session } : {}
  );
};
