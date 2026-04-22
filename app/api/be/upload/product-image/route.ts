/**
 * Local mock: save product images under `public/uploads/products/`.
 * When `API_BASE` is set, use your backend upload endpoint instead.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { API_BASE } from "@/data/utils/api.urls";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (API_BASE) {
    return NextResponse.json(
      {
        message:
          "File upload is handled by your API when API_BASE is set. Implement POST /v1/upload or similar on the backend.",
      },
      { status: 501 }
    );
  }

  const session = await getServerSession(authOptions);
  if ((session as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ message: "Missing file field \"file\"" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json(
      { message: "Allowed types: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "Maximum file size is 5 MB" },
      { status: 400 }
    );
  }

  const ext =
    mime === "image/jpeg"
      ? ".jpg"
      : mime === "image/png"
        ? ".png"
        : mime === "image/webp"
          ? ".webp"
          : ".gif";

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);

  const url = `/uploads/products/${safeName}`;
  return NextResponse.json({ url });
}
