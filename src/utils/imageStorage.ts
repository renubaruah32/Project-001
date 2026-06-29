import { getPool, isPgActive } from "../db/postgres";

/**
 * Uploads a base64 image directly to PostgreSQL/Supabase for global persistence.
 * @param filename The unique name of the image file (e.g. "hero_banner.png").
 * @param base64Image The full base64 string including data URI prefix.
 * @param assetType The category of the image (e.g. "hero", "game", "avatar").
 * @param gameId Optional associated game ID.
 */
export async function uploadImageToDatabase(
  filename: string,
  base64Image: string,
  assetType: string,
  gameId?: string
): Promise<string | null> {
  if (isPgActive()) {
    const activePool = getPool();
    if (activePool) {
      try {
        const client = await activePool.connect();
        try {
          await client.query(`
            INSERT INTO website_images (filename, base64_image, asset_type, game_id, uploaded_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (filename) DO UPDATE 
            SET base64_image = EXCLUDED.base64_image, asset_type = EXCLUDED.asset_type, game_id = EXCLUDED.game_id, uploaded_at = NOW()
          `, [filename, base64Image, assetType, gameId || null]);
          console.log(`[Supabase DB] Image successfully uploaded to website_images table: ${filename}`);
          return `/api/images/${filename}`;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("[Supabase DB] Failed to upload image to website_images table:", err);
      }
    }
  } else {
    console.warn("[Database] Postgres not active, skipped DB upload for:", filename);
  }
  return null;
}

/**
 * Retrieves a base64 image from PostgreSQL/Supabase by its filename.
 * @param filename The filename to look up.
 * @returns The base64 data URI, or null if not found/error.
 */
export async function retrieveImageFromDatabase(filename: string): Promise<string | null> {
  if (isPgActive()) {
    const activePool = getPool();
    if (activePool) {
      try {
        const client = await activePool.connect();
        try {
          const res = await client.query("SELECT base64_image FROM website_images WHERE filename = $1", [filename]);
          if (res.rows.length > 0) {
            return res.rows[0].base64_image || null;
          }
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("[Supabase DB] Failed to retrieve image from website_images table:", err);
      }
    }
  }
  return null;
}
