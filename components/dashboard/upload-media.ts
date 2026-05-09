export function uploadMediaWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const maxUploadBytes = 200 * 1024 * 1024;
    if (file.size > maxUploadBytes) {
      reject(new Error("Upload failed: this file is larger than 200MB."));
      return;
    }

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
          : {}) as {
          url?: string;
          message?: string;
          error?: string;
        };

        if (xhr.status < 200 || xhr.status >= 300) {
          const fallback =
            xhr.status === 413
              ? "Upload failed: the video is too large for the server upload limit."
              : xhr.responseText?.trim() || "Upload failed";
          reject(new Error(json.message ?? json.error ?? fallback));
          return;
        }

        if (!json.url) {
          reject(
            new Error(
              xhr.responseText?.trim()
                ? `Upload failed: ${xhr.responseText.trim()}`
                : "Upload failed: no URL returned"
            )
          );
          return;
        }

        onProgress?.(100);
        resolve(json.url);
      } catch {
        const message =
          xhr.responseText?.trim() ||
          "Upload failed: the server returned an unreadable response.";
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}
