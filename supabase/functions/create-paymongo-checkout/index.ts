import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = [
  "https://adminchill.vercel.app",
  "http://localhost:1234",
  "http://localhost:3000",
];

function isAllowedOrigin(origin: string) {
  return (
    allowedOrigins.includes(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

function getCorsHeaders(origin: string) {
  const allowedOrigin = isAllowedOrigin(origin)
    ? origin
    : "https://adminchill.vercel.app";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export default {
  async fetch(req: Request) {
    const origin = req.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: corsHeaders,
        },
      );
    }

    try {
      const authorization = req.headers.get("Authorization");

      if (!authorization?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({
            error: "Authentication required",
          }),
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const supabaseServiceRoleKey = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );
      const paymongoSecretKey = Deno.env.get(
        "PAYMONGO_SECRET_KEY",
      );

      if (
        !supabaseUrl ||
        !supabaseAnonKey ||
        !supabaseServiceRoleKey ||
        !paymongoSecretKey
      ) {
        throw new Error(
          "Required server environment variables are missing",
        );
      }

      if (!paymongoSecretKey.startsWith("sk_test_")) {
        throw new Error(
          "The payment backend is not configured for PayMongo Test Mode",
        );
      }

      const userClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: authorization,
            },
          },
        },
      );

      const {
        data: { user },
        error: userError,
      } = await userClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({
            error: "Invalid or expired user session",
          }),
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      const body = await req.json();
      const orderId = body?.order_id;

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (
        typeof orderId !== "string" ||
        !uuidPattern.test(orderId)
      ) {
        return new Response(
          JSON.stringify({
            error: "A valid order_id is required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const adminClient = createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
      );

      const { data: order, error: orderError } =
        await adminClient
          .from("orders")
          .select(`
            id,
            user_id,
            full_name,
            email,
            total_amount,
            status,
            payment_status
          `)
          .eq("id", orderId)
          .eq("user_id", user.id)
          .maybeSingle();

      if (orderError) {
        throw orderError;
      }

      if (!order) {
        return new Response(
          JSON.stringify({
            error: "Order not found",
          }),
          {
            status: 404,
            headers: corsHeaders,
          },
        );
      }

      if (order.payment_status === "paid") {
        return new Response(
          JSON.stringify({
            error: "This order is already paid",
          }),
          {
            status: 409,
            headers: corsHeaders,
          },
        );
      }

      const amount = Number(order.total_amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return new Response(
          JSON.stringify({
            error: "The order has an invalid total amount",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const amountInCentavos = Math.round(amount * 100);

      if (amountInCentavos < 100) {
        return new Response(
          JSON.stringify({
            error: "Minimum payment amount is PHP 1.00",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const { data: existingPayment, error: existingError } =
        await adminClient
          .from("payments")
          .select(`
            id,
            checkout_session_id,
            checkout_url,
            status
          `)
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .not("checkout_url", "is", null)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingPayment?.checkout_url) {
        return new Response(
          JSON.stringify({
            payment_id: existingPayment.id,
            checkout_session_id:
              existingPayment.checkout_session_id,
            checkout_url: existingPayment.checkout_url,
          }),
          {
            status: 200,
            headers: corsHeaders,
          },
        );
      }

      const internalPaymentId = crypto.randomUUID();

      const { error: paymentInsertError } =
        await adminClient
          .from("payments")
          .insert({
            id: internalPaymentId,
            user_id: user.id,
            order_id: order.id,
            amount,
            currency: "PHP",
            provider: "paymongo",
            status: "pending",
            reference_number: `ORDER-${order.id}`,
            metadata: {
              environment: "test",
              order_id: order.id,
            },
          });

      if (paymentInsertError) {
        throw paymentInsertError;
      }

      const appUrl = isAllowedOrigin(origin)
        ? origin
        : "https://adminchill.vercel.app";

      const checkoutPayload = {
        data: {
          attributes: {
            line_items: [
              {
                name: `Aircon Product Order ${order.id.slice(0, 8)}`,
                amount: amountInCentavos,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: [
              "card",
              "gcash",
              "qrph",
            ],
            success_url:
              `${appUrl}/?payment=success&order_id=${order.id}`,
            cancel_url:
              `${appUrl}/?payment=cancelled&order_id=${order.id}`,
            reference_number: `ORDER-${order.id}`,
            send_email_receipt: true,
            pass_on_fees: false,
            metadata: {
              internal_payment_id: internalPaymentId,
              order_id: order.id,
              user_id: user.id,
            },
          },
        },
      };

      const paymongoResponse = await fetch(
        "https://api.paymongo.com/v2/checkout_sessions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Basic ${btoa(`${paymongoSecretKey}:`)}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(checkoutPayload),
        },
      );

      const paymongoResult = await paymongoResponse.json();

      if (!paymongoResponse.ok) {
        await adminClient
          .from("payments")
          .update({
            status: "failed",
            metadata: {
              environment: "test",
              order_id: order.id,
              paymongo_error:
                paymongoResult?.errors || "Checkout creation failed",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", internalPaymentId);

        const paymentError =
          paymongoResult?.errors?.[0]?.detail ||
          "PayMongo checkout creation failed";

        return new Response(
          JSON.stringify({
            error: paymentError,
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const checkoutSession = paymongoResult?.data;
      const checkoutUrl =
        checkoutSession?.attributes?.checkout_url;

      if (!checkoutSession?.id || !checkoutUrl) {
        throw new Error(
          "PayMongo returned an incomplete checkout session",
        );
      }

      const { error: paymentUpdateError } =
        await adminClient
          .from("payments")
          .update({
            checkout_session_id: checkoutSession.id,
            checkout_url: checkoutUrl,
            metadata: {
              environment: "test",
              order_id: order.id,
              checkout_status:
                checkoutSession.attributes?.status || "active",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", internalPaymentId);

      if (paymentUpdateError) {
        throw paymentUpdateError;
      }

      return new Response(
        JSON.stringify({
          payment_id: internalPaymentId,
          checkout_session_id: checkoutSession.id,
          checkout_url: checkoutUrl,
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Create checkout error:", error);

      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Unexpected server error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};