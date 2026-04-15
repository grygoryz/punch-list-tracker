import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const PHOTO_BUCKET = "punch-photos";

export async function uploadPhoto(file: File, pathPrefix: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
