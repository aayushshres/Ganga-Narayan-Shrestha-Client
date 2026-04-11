export async function uploadToImgbb(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error("ImgBB API key not configured");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`ImgBB upload failed: ${res.status}`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || "ImgBB upload failed");
  }

  return data.data.display_url as string;
}
