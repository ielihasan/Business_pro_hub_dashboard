import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      full_name,
      email,
      password,
      business_name,
      business_type,
      business_address,
      business_phone,
      business_description,
      subscription_plan,
      is_approved,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Verify business exists
    const { data: existingBusiness, error: fetchError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", id)
      .eq("role", "business_owner")
      .single();

    if (fetchError || !existingBusiness) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Update Auth user if email or password changed
    const authUpdates: Record<string, any> = {};
    if (email && email !== existingBusiness.email) {
      authUpdates.email = email;
    }
    if (password) {
      authUpdates.password = password;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        id,
        authUpdates
      );

      if (authError) {
        console.error("Auth update error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // Prepare update object for admins table
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (business_type !== undefined) updateData.business_type = business_type;
    if (business_address !== undefined) updateData.business_address = business_address;
    if (business_phone !== undefined) updateData.business_phone = business_phone;
    if (business_description !== undefined) updateData.business_description = business_description;
    if (subscription_plan !== undefined) updateData.subscription_plan = subscription_plan;
    if (is_approved !== undefined) {
      updateData.is_approved = is_approved;
      if (is_approved && !existingBusiness.is_approved) {
        updateData.approved_at = new Date().toISOString();
      }
    }

    // Update admins table (role/auth record)
    const { error: updateAdminError } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", id)
      .eq("role", "business_owner");

    if (updateAdminError) {
      console.error("Admins update error:", updateAdminError);
      return NextResponse.json({ error: updateAdminError.message }, { status: 400 });
    }

    // Mirror changes to businesses table (canonical FK target)
    const businessUpdateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined)            businessUpdateData.full_name = full_name;
    if (email !== undefined)                businessUpdateData.email = email;
    if (business_name !== undefined)        businessUpdateData.business_name = business_name;
    if (business_type !== undefined)        businessUpdateData.business_type = business_type;
    if (business_address !== undefined)     businessUpdateData.business_address = business_address;
    if (business_phone !== undefined)       businessUpdateData.business_phone = business_phone;
    if (business_description !== undefined) businessUpdateData.business_description = business_description;
    if (subscription_plan !== undefined)    businessUpdateData.subscription_plan = subscription_plan;
    if (is_approved !== undefined)          businessUpdateData.is_active = is_approved;

    const { data: updatedBusiness, error: updateBusinessError } = await supabase
      .from("businesses")
      .update(businessUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (updateBusinessError) {
      console.error("Businesses update error:", updateBusinessError);
      return NextResponse.json({ error: updateBusinessError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: updatedBusiness,
      message: "Business updated successfully",
    });
  } catch (err: any) {
    console.error("Update business error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
