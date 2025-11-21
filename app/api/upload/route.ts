import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const form = await req.formData();
  const username = form.get("username")?.toString();
  const files = form.getAll("files[]") as File[];

  if (!username || files.length === 0) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (files.length > 6) {
    return NextResponse.json(
      { error: "Maximum 6 images allowed" },
      { status: 400 }
    );
  }

  // Ensure username is unique
  const { data: exists } = await supabase
    .from("profiles")
    .select()
    .eq("username", username)
    .maybeSingle();

  if (exists) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 409 }
    );
  }

  // Create user profile
  const userId = randomUUID();

  await supabase.from("profiles").insert({
    id: userId,
    username,
  });

  // Store image URLs
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const unique = randomUUID();
    const path = `${userId}/${unique}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("user-images")
      .upload(path, file);

    if (uploadErr) {
      console.log(uploadErr);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // Get Public URL
    const { data } = supabase.storage
      .from("user-images")
      .getPublicUrl(path);

    urls.push(data.publicUrl);
  }

  return NextResponse.json({
    success: true,
    userId,
    images: urls,
  });
}
