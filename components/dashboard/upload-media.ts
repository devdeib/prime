export function uploadMediaWithProgress(
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
        const json = JSON.parse(xhr.responseText) as {
          url?: string;
          message?: string;
          error?: string;
        };

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(json.message ?? json.error ?? "Upload failed"));
          return;
        }

        if (!json.url) {
          reject(new Error("No URL returned"));
          return;
        }

        onProgress?.(100);
        resolve(json.url);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}
