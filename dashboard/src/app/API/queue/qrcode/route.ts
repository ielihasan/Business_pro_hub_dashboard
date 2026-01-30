import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Generate QR code for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const queueTypeId = searchParams.get("queue_type_id");
    const format = searchParams.get("format") || "dataurl"; // dataurl, svg, or png

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name, owner_id")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get queue type info if provided
    let queueTypeName: string | null = null;
    if (queueTypeId && queueTypeId !== "all" && queueTypeId !== "default") {
      const { data: queueType } = await supabase
        .from("queue_types")
        .select("name")
        .eq("id", queueTypeId)
        .single();

      if (queueType) {
        queueTypeName = queueType.name;
      }
    }

    // Generate the queue join URL
    // This URL will open the mobile app or web page for joining queue
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    let queueJoinUrl = `${baseUrl}/join-queue/${businessId}`;

    // Add queue_type parameter if specified
    if (queueTypeId && queueTypeId !== "all" && queueTypeId !== "default") {
      queueJoinUrl += `?queue_type=${queueTypeId}`;
    }

    // QR Code options for data URL
    const qrDataUrlOptions = {
      errorCorrectionLevel: "H" as const,
      type: "image/png" as const,
      quality: 0.92,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 400,
    };

    let qrCodeData: string;

    if (format === "svg") {
      qrCodeData = await QRCode.toString(queueJoinUrl, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 400,
      });
    } else {
      qrCodeData = await QRCode.toDataURL(queueJoinUrl, qrDataUrlOptions);
    }

    return NextResponse.json({
      data: {
        qr_code: qrCodeData,
        join_url: queueJoinUrl,
        business_id: businessId,
        business_name: business.business_name,
        queue_type_id: queueTypeId || null,
        queue_type_name: queueTypeName,
        format,
      },
    });
  } catch (err: any) {
    console.error("QR code generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
