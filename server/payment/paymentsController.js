import Stripe from "stripe";
import Course from "../course/course.js";



const stripe = new Stripe("sk_test_51RMN2bIGCsnWSTOBJI5A1xYouI452VgkkK5uwVVBc5Atx1ZtuRX6mFfsA3mq9xFLTve9DzvS843oQ78IgKgecexb00GHlGrvLl");

export const createCheckoutSession = async (req, res) => {
  try {
    const { courseId, amount,  } = req.body;
    const course =  await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: course.courseName,
            },
            unit_amount: amount * 100, 
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/dashboard`,
      cancel_url: `http://localhost:3000/PaymentFailure`,
      metadata: {
        courseId,
        userId: req.user.id,
        amount,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};
