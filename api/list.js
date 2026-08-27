// GET /api/list?token=TU_TOKEN&format=csv
// Devuelve las confirmaciones guardadas. Protegido con un token simple.
//
// Variable de entorno adicional requerida en Vercel:
//   ADMIN_TOKEN -> cualquier cadena que tú definas, para ver la lista sin entrar a Supabase

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const { token, format } = req.query;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: 'El sistema no está configurado todavía.' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rsvps?select=name,phone,email,agency,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ ok: false, error: 'No se pudo consultar Supabase.' });
    }

    const rows = await response.json();

    if (format === 'csv') {
      const header = 'Nombre,Telefono,Correo,Agencia,Fecha\n';
      const body = rows
        .map((r) =>
          [r.name, r.phone, r.email || '', r.agency || '', r.created_at]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="rsvps.csv"');
      return res.status(200).send(header + body);
    }

    return res.status(200).json({ ok: true, count: rows.length, rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Error inesperado.' });
  }
}
