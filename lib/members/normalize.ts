export type DbMemberRow = Record<string, any>;

// Convert a DB row (which may have legacy Indonesian column names)
// into a normalized API shape with English keys.
export function normalizeDbMember(row: DbMemberRow) {
  if (!row) return null;
  const sekbid = row.sekbid
    ? {
        id: row.sekbid.id,
        name: row.sekbid.name ?? row.sekbid.nama ?? null,
        color: row.sekbid.color ?? null,
        icon: row.sekbid.icon ?? null,
      }
    : null;

  return {
    id: row.id,
    name: row.name ?? row.nama ?? null,
    role: row.role ?? row.jabatan ?? null,
    photo_url: row.photo_url ?? row.foto_url ?? null,
    instagram: row.instagram ?? null,
    // `class` column may be legacy or absent; also accept `kelas` as a
    // possible legacy name. This only reads data — writes are handled via
    // prepareWritePayload which avoids writing to missing columns.
    class: row.class ?? row.kelas ?? null,
    quote: row.quote ?? row.quotes ?? null,
    display_order: row.display_order ?? row.order_index ?? null,
    sekbid,
    is_active: row.is_active ?? row.active ?? true,
  };
}

// Prepare insert/update payload so both legacy and current columns are written.
export function prepareWritePayload(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  if (payload.name !== undefined) {
    out.name = payload.name;
    out.nama = payload.name; // keep legacy column in sync
  }
  if (payload.role !== undefined) {
    out.role = payload.role;
    out.jabatan = payload.role;
  }
  if (payload.photo_url !== undefined) {
    out.photo_url = payload.photo_url;
    out.foto_url = payload.photo_url;
  }
  if (payload.instagram !== undefined) out.instagram = payload.instagram;
  // Avoid writing to `class` directly — some databases may not have this
  // column. If a legacy `kelas` column exists and you want to mirror to it,
  // add that mapping here once the schema is confirmed. For now we skip
  // writing class to prevent runtime DB errors.
  if (payload.quote !== undefined) {
    // DB only has 'quotes' column (legacy), not 'quote'
    out.quotes = payload.quote;
  }
  if (payload.display_order !== undefined) {
    out.display_order = payload.display_order;
    out.order_index = payload.display_order;
  }
  if (payload.sekbid_id !== undefined) out.sekbid_id = payload.sekbid_id;
  if (payload.is_active !== undefined) {
    out.is_active = payload.is_active;
    out.active = payload.is_active;
  }
  return out;
}
