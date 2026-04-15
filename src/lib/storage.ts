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

export async function getPhotoUrls(
  paths: (string | null)[]
): Promise<(string | null)[]> {
  const nonEmpty = paths.filter((p): p is string => !!p);
  if (nonEmpty.length === 0) return paths.map(() => null);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(nonEmpty, 60 * 60);
  if (error || !data) return paths.map(() => null);

  const byPath = new Map<string, string>();
  for (const entry of data) {
    if (entry.path && entry.signedUrl) byPath.set(entry.path, entry.signedUrl);
  }
  return paths.map((p) => (p ? byPath.get(p) ?? null : null));
}
