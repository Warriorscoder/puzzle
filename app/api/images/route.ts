import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Always return JSON
  if (!userId) {
    return NextResponse.json({ images: [] });
  }

  // Helper: Convert storage path → public URL
  const toUrl = (path: string) => {
    const { data } = supabase.storage
      .from("user-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  //
  // 1️⃣ Fetch user's uploaded images
  //
  const { data: userFiles, error: userErr } = await supabase.storage
    .from("user-images")
    .list(`${userId}/`, {
      limit: 100,
      sortBy: { column: "updated_at", order: "desc" },
    });

  if (userErr || !userFiles) {
    return NextResponse.json({ images: [] });
  }

  const userCount = userFiles.length;

  //
  // 2️⃣ User has more than 6 → take latest 6
  //
  if (userCount > 6) {
    const latest6 = userFiles.slice(0, 6);
    const urls = latest6.map((f) => toUrl(`${userId}/${f.name}`));
    return NextResponse.json({ images: urls });
  }

  //
  // 3️⃣ User has exactly 6 → return as-is
  //
  if (userCount === 6) {
    const urls = userFiles.map((f) => toUrl(`${userId}/${f.name}`));
    return NextResponse.json({ images: urls });
  }

  //
  // 4️⃣ User has LESS than 6 → fetch other users’ images
  //
  const { data: rootItems, error: rootErr } = await supabase.storage
    .from("user-images")
    .list("", { limit: 200 });

  if (rootErr || !rootItems) {
    // fallback: return only user images
    const fallback = userFiles.map((f) => toUrl(`${userId}/${f.name}`));
    return NextResponse.json({ images: fallback });
  }

  // Find all folder names except this user's folder
  const otherFolders = rootItems
    .filter((item) => item.name.endsWith("/") && item.name !== `${userId}/`)
    .map((folder) => folder.name.replace("/", ""));

  const fillerPool: string[] = [];

  // Read images from other folders
  for (const folder of otherFolders) {
    const { data: imgs } = await supabase.storage
      .from("user-images")
      .list(`${folder}/`, {
        limit: 30,
        sortBy: { column: "updated_at", order: "desc" },
      });

    if (imgs && imgs.length > 0) {
      imgs.forEach((img) => {
        fillerPool.push(`${folder}/${img.name}`);
      });
    }
  }

  // If no filler images found, return only user images
  if (fillerPool.length === 0) {
    const urls = userFiles.map((f) => toUrl(`${userId}/${f.name}`));
    return NextResponse.json({ images: urls });
  }

  // We need a total of 6 images
  const need = 6 - userCount;

  // Randomly pick filler images
  const filler = fillerPool
    .sort(() => Math.random() - 0.5)
    .slice(0, need)
    .map((path) => toUrl(path));

  const userUrls = userFiles.map((f) => toUrl(`${userId}/${f.name}`));

  const final = [...userUrls, ...filler];

  return NextResponse.json({ images: final });
}
