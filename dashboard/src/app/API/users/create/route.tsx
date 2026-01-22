import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔐 Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, email, full_name, phone_no, password } =
      await req.json();

    // 1️⃣ Validation
    if (!username || !email || !full_name || !phone_no || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    let userId = "";
    let userData: any = null;

    // 2️⃣ Create Auth User
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, full_name, phone_no },
      });

    // 3️⃣ If email already exists
    if (authError && authError.message.includes("already been registered")) {
      const { data: listData, error: listError } =
        await supabase.auth.admin.listUsers({ limit: 1000 });

      if (listError)
        return NextResponse.json({ error: listError.message }, { status: 400 });

      const existingUser = listData.users.find(
        (u) => u.email === email
      );

      if (!existingUser)
        return NextResponse.json(
          { error: "Auth user exists but not found" },
          { status: 400 }
        );

      userId = existingUser.id;

      // 🔍 Check User table
      const { data: existingUserRow, error: fetchError } =
        await supabase
          .from('User')
          .select("*")
          .eq("id", userId)
          .maybeSingle();

      if (fetchError)
        return NextResponse.json(
          { error: fetchError.message },
          { status: 400 }
        );

      // ➕ If not exists → create
      if (!existingUserRow) {
        const { data, error } = await supabase
          .from('User')
          .insert({
            id: userId,
            username,
            email,
            full_name,
            phone_no,
          })
          .select()
          .single();

        if (error)
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );

        userData = data;
      } else {
        userData = existingUserRow;
      }

      return NextResponse.json(
        { data: userData, info: "User already exists" },
        { status: 200 }
      );
    }

    // 4️⃣ New user → insert in "User" table
    userId = authData.user.id;

    const { data: createdUser, error: insertError } =
      await supabase
        .from('User')
        .insert({
          id: userId,
          username,
          email,
          full_name,
          phone_no,
        })
        .select()
        .single();

    if (insertError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: createdUser, info: "User created successfully" },
      { status: 201 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
