import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Generate QR code for a business queue
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const format = searchParams.get("format") || "dataurl";

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name")
      .eq("id", businessId)
      .eq("is_active", true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Generate QR code
    const { qrCodeData, joinUrl } = await generateQr(businessId, format);

    return NextResponse.json({
      data: {
        qr_code: qrCodeData,
        join_url: joinUrl,
        business_id: businessId,
        business_name: business.business_name,
        format,
      },
    });
  } catch (err: any) {
    console.error("QR code generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Force regenerate QR code
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, format = "dataurl" } = body;

    if (!business_id) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Generate new QR code
    const { qrCodeData, joinUrl } = await generateQr(business_id, format);

    return NextResponse.json({
      data: {
        qr_code: qrCodeData,
        join_url: joinUrl,
        business_id,
        format,
      },
      message: "QR code regenerated successfully",
    });
  } catch (err: any) {
    console.error("QR code regeneration error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateQr(
  businessId: string,
  format: string
): Promise<{ qrCodeData: string; joinUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
  const joinUrl = `${baseUrl}/join-queue/${businessId}`;

  const qrOptions = {
    errorCorrectionLevel: "H" as const,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    width: 400,
  };

  let qrCodeData: string;
  if (format === "svg") {
    qrCodeData = await QRCode.toString(joinUrl, {
      type: "svg",
      ...qrOptions,
    });
  } else {
    qrCodeData = await QRCode.toDataURL(joinUrl, {
      ...qrOptions,
    });
  }

  return { qrCodeData, joinUrl };
}
