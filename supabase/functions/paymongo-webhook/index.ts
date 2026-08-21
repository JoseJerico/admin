import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function createHmacHex(
  secret: string,
  value: string,
) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;

  let difference = 0;

  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return difference === 0;
}

function parseSignatureHeader(header: string) {
  const parts: Record<string, string> = {};

  for (const section of header.split(",")) {
    const separatorIndex = section.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = section.slice(0, separatorIndex).trim();
    const value = section.slice(separatorIndex + 1).trim();

    parts[key] = value;
  }

  return parts;
}

export default {
  async fetch(req: Request) {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          error: "Method not allowed",
        },
        405,
      );
    }

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );
      const webhookSecret = Deno.env.get(
        "PAYMONGO_WEBHOOK_SECRET",
      );
      const paymongoSecretKey = Deno.env.get(
        "PAYMONGO_SECRET_KEY",
      );
      if (
        !supabaseUrl ||
        !serviceRoleKey ||
        !webhookSecret ||
        !paymongoSecretKey
      ) {
        console.error("Webhook environment variables are missing");

        return jsonResponse(
          {
            error: "Webhook is not configured",
          },
          500,
        );
      }

      const signatureHeader = req.headers.get(
        "Paymongo-Signature",
      );

      if (!signatureHeader) {
        return jsonResponse(
          {
            error: "Missing PayMongo signature",
          },
          401,
        );
      }

      const rawBody = await req.text();
      const signatures = parseSignatureHeader(
        signatureHeader,
      );

      const timestamp = signatures.t;
      const testSignature = signatures.te;

      if (!timestamp || !testSignature) {
        return jsonResponse(
          {
            error: "Invalid PayMongo signature format",
          },
          401,
        );
      }

      const timestampNumber = Number(timestamp);
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (
        !Number.isFinite(timestampNumber) ||
        Math.abs(currentTimestamp - timestampNumber) > 600
      ) {
        return jsonResponse(
          {
            error: "Expired webhook signature",
          },
          401,
        );
      }

      const expectedSignature = await createHmacHex(
        webhookSecret,
        `${timestamp}.${rawBody}`,
      );

      if (!safeCompare(expectedSignature, testSignature)) {
        return jsonResponse(
          {
            error: "Invalid webhook signature",
          },
          401,
        );
      }

      let payload;

      try {
        payload = JSON.parse(rawBody);
      } catch {
        return jsonResponse(
          {
            error: "Invalid JSON payload",
          },
          400,
        );
      }

      // Supports PayMongo event-envelope, wrapped resource,
      // and direct Checkout Session payloads.
      const eventData = payload?.data;

      const isPaidEvent =
        payload?.event_type === "checkout_session.payment.paid" ||
        payload?.type === "checkout_session.payment.paid" ||
        eventData?.type === "checkout_session.payment.paid" ||
        eventData?.attributes?.type ===
        "checkout_session.payment.paid";

      const directCheckoutSession =
        payload?.type === "checkout_session"
          ? payload
          : eventData?.type === "checkout_session"
            ? eventData
            : null;

      if (!isPaidEvent && !directCheckoutSession) {
        console.log("Ignored PayMongo payload shape", {
          rootType: payload?.type || null,
          eventType: payload?.event_type || null,
          dataType: eventData?.type || null,
        });

        return jsonResponse({
          received: true,
          ignored: true,
        });
      }

      const checkoutSession =
        directCheckoutSession ||
        eventData?.data ||
        eventData?.attributes?.data;

      const checkoutSessionId = checkoutSession?.id;
      const checkoutAttributes = checkoutSession?.attributes;
      const metadata = checkoutAttributes?.metadata || {};

      const internalPaymentId =
        metadata.internal_payment_id;

      const metadataOrderId = metadata.order_id;

      if (
        !checkoutSessionId ||
        !internalPaymentId ||
        !metadataOrderId
      ) {
        return jsonResponse(
          {
            error: "Required payment metadata is missing",
          },
          400,
        );
      }

      const paymentIntentId =
        checkoutAttributes?.payment_intent?.id;

      if (!paymentIntentId) {
        return jsonResponse(
          {
            error: "Payment Intent ID is missing",
          },
          400,
        );
      }

      // Retrieve the latest Payment Intent directly from PayMongo.
      // This verifies the final status and obtains the actual payment method.
      const paymentIntentResponse = await fetch(
        `https://api.paymongo.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)
        }`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Basic ${btoa(`${paymongoSecretKey}:`)}`,
            Accept: "application/json",
          },
        },
      );

      if (!paymentIntentResponse.ok) {
        const responseText = await paymentIntentResponse.text();

        console.error(
          "Unable to retrieve PayMongo Payment Intent:",
          paymentIntentResponse.status,
          responseText,
        );

        return jsonResponse(
          {
            error: "Unable to verify payment with PayMongo",
          },
          502,
        );
      }

      const paymentIntentPayload =
        await paymentIntentResponse.json();

      const paymentIntentAttributes =
        paymentIntentPayload?.data?.attributes || {};

      if (paymentIntentAttributes.status !== "succeeded") {
        console.error(
          "PayMongo Payment Intent is not succeeded:",
          paymentIntentAttributes.status,
        );

        return jsonResponse(
          {
            error: "Payment is not yet verified as successful",
          },
          409,
        );
      }

      const paymentAttempts =
        paymentIntentAttributes?.payments || [];

      const paidAttempt =
        [...paymentAttempts]
          .reverse()
          .find(
            (payment) =>
              payment?.attributes?.status === "paid",
          );

      if (!paidAttempt) {
        return jsonResponse(
          {
            error: "Verified paid payment record is missing",
          },
          409,
        );
      }

      const paymongoPaymentId = paidAttempt.id;
      const paymentAttributes =
        paidAttempt.attributes || {};

      const paymentMethod =
        paymentAttributes?.source?.type ||
        paymentAttributes?.sources?.type ||
        checkoutAttributes?.payment_method_used ||
        "paymongo";

      const adminClient = createClient(
        supabaseUrl,
        serviceRoleKey,
      );

      const {
        data: paymentRecord,
        error: paymentFetchError,
      } = await adminClient
        .from("payments")
        .select(`
          id,
          order_id,
          user_id,
          status,
          paid_at
        `)
        .eq("id", internalPaymentId)
        .eq("checkout_session_id", checkoutSessionId)
        .maybeSingle();

      if (paymentFetchError) {
        throw paymentFetchError;
      }

      if (!paymentRecord) {
        return jsonResponse(
          {
            error: "Payment record not found",
          },
          404,
        );
      }

      if (paymentRecord.order_id !== metadataOrderId) {
        return jsonResponse(
          {
            error: "Payment metadata mismatch",
          },
          400,
        );
      }

      const wasAlreadyPaid =
        paymentRecord.status === "paid";

      const paymongoPaidAt =
        paymentAttributes?.paid_at;

      const paidAt =
        typeof paymongoPaidAt === "number"
          ? new Date(paymongoPaidAt * 1000).toISOString()
          : paymentRecord.paid_at || new Date().toISOString();

      const referenceNumber =
        checkoutAttributes?.reference_number ||
        `ORDER-${metadataOrderId}`;

      const {
        error: paymentUpdateError,
      } = await adminClient
        .from("payments")
        .update({
          status: "paid",
          payment_id: paymongoPaymentId,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          paid_at: paidAt,
          metadata: {
            environment: "test",
            order_id: metadataOrderId,
            checkout_session_id: checkoutSessionId,
            payment_intent_id:
              checkoutAttributes?.payment_intent?.id || null,
          },
          updated_at: paidAt,
        })
        .eq("id", paymentRecord.id);

      if (paymentUpdateError) {
        throw paymentUpdateError;
      }

      const {
        error: orderUpdateError,
      } = await adminClient
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: paymentMethod,
          payment_reference: referenceNumber,
        })
        .eq("id", metadataOrderId)
        .eq("user_id", paymentRecord.user_id);

      if (orderUpdateError) {
        throw orderUpdateError;
      }

      if (!wasAlreadyPaid) {
        const {
          error: notificationError,
        } = await adminClient
          .from("notifications")
          .insert({
            user_id: paymentRecord.user_id,
            title: "Payment Successful",
            message:
              "Your PayMongo test payment was successfully confirmed.",
            type: "payment",
          });

        if (notificationError) {
          console.error(
            "Payment notification failed:",
            notificationError,
          );
        }
      }

      return jsonResponse({
        received: true,
        processed: true,
      });
    } catch (error) {
      console.error("PayMongo webhook error:", error);

      return jsonResponse(
        {
          error: "Webhook processing failed",
        },
        500,
      );
    }
  },
};