import express from "express";
import {
  getCoursePurchaseStatus,
  getPurchasedCourses,
  initiateStripeCheckout,
} from "../controllers/coursePurchase.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, initiateStripeCheckout);

// The Stripe webhook (POST /api/v1/purchase/webhook) is mounted in index.js before express.json(),
// because signature verification needs the raw, unparsed body.

router
  .route("/course/:courseId/detail-with-status")
  .get(isAuthenticated, getCoursePurchaseStatus);

router.route("/").get(isAuthenticated, getPurchasedCourses);

export default router;
