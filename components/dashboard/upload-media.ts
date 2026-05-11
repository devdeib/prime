import { supabase } from "@/lib/supabase";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const STORAGE_BUCKET = "products";
/** Next.js App Route body limits are small; API fallback only for smaller files. */
const API_ROUTE_MAX_BYTES = 4 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 180_000;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function runProgressSimulation(
  onProgress: ((n: number) => void) | undefined,
  stopRef: { current: boolean }
) {
  if (typeof window === "undefined") {
    return () => {};
  }
  let value = 5;
  const id = window.setInterval(() => {
    if (stopRef.current) return;
    value = Math.min(88, value + Math.max(1, Math.round((90 - value) * 0.08)));
    onProgress?.(value);
  }, 450);
  return () => {
    window.clearInterval(id);
  };
}

function uploadViaApiRoute(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "/api/be/upload/product-image", true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      try {
        const contentType = xhr.getResponseHeader("content-type") ?? "";
        const isJson = contentType.includes("application/json");
        const json = (isJson && xhr.responseText
          ? JSON.parse(xhr.responseText)
          : {}) as { url?: string; message?: string; error?: string };

        if (xhr.status < 200 || xhr.status >= 300) {
          const fallback =
            xhr.status === 413
              ? "Upload failed: file too large for the API route. Configure Supabase Storage and use the dashboard env vars so uploads go directly to Storage (see project docs)."
              : (json.message ?? json.error ?? xhr.responseText?.trim()) || "Upload failed";
          reject(new Error(fallback));
          return;
        }
        if (!json.url) {
          reject(new Error("Upload failed: no URL returned"));
          return;
        }
        onProgress?.(100);
        resolve(json.url);
      } catch {
        reject(new Error(xhr.responseText?.trim() || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed (network error)"));
    xhr.send(formData);
  });
}

/**
 * Large files upload directly to Supabase Storage (browser → Storage) to avoid
 * Next.js App Route body limits. Small files can fall back to `/api/be/upload/...`
 * when Supabase env vars are missing (local dev only).
 */
export async function uploadMediaWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Upload failed: this file is larger than 100MB.");
  }

  if (!isSupabaseConfigured()) {
    if (file.size > API_ROUTE_MAX_BYTES) {
      throw new Error(
        "Large video/image uploads need Supabase Storage. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, restart dev, then in Supabase: create a public bucket named \"products\", add Storage policies so anonymous uploads are allowed (or use signed uploads), and add http://localhost:3000 under Authentication → URL configuration / API CORS if uploads hang."
      );
    }
    onProgress?.(0);
    return uploadViaApiRoute(file, onProgress);
  }

  onProgress?.(5);
  const fileExt = file.name.split(".").pop() || "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const stopSim = { current: false };
  const clearSim = runProgressSimulation(onProgress, stopSim);

  const timeoutPromise = new Promise<never>((_, reject) => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      reject(
        new Error(
          `Upload timed out after ${Math.round(UPLOAD_TIMEOUT_MS / 1000)}s. Check Supabase: bucket "${STORAGE_BUCKET}" exists, Storage INSERT policy allows your anon key, and CORS allows this site (e.g. http://localhost:3000).`
        )
      );
    }, UPLOAD_TIMEOUT_MS);
  });

  try {
    const uploadPromise = supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    const { error } = result;

    if (error) {
      if (file.size <= API_ROUTE_MAX_BYTES) {
        stopSim.current = true;
        clearSim();
        onProgress?.(0);
        return uploadViaApiRoute(file, onProgress);
      }
      throw new Error(
        `${error.message} — For files this size, fix Supabase Storage (bucket + policies) or see the error above.`
      );
    }

    stopSim.current = true;
    clearSim();
    onProgress?.(92);

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error("Upload failed: no public URL returned");
    }

    onProgress?.(100);
    return urlData.publicUrl;
  } catch (err) {
    stopSim.current = true;
    clearSim();
    if (
      file.size <= API_ROUTE_MAX_BYTES &&
      err instanceof Error &&
      !err.message.includes("larger than")
    ) {
      try {
        onProgress?.(0);
        return await uploadViaApiRoute(file, onProgress);
      } catch {
        /* fall through */
      }
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}
