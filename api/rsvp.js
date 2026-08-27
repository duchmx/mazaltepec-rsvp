// POST /api/rsvp
// Guarda una confirmación de asistencia en la tabla "rsvps" de Supabase.
//
// Variables de entorno requeridas en Vercel (Project Settings > Environment Variables):
//   SUPABASE_URL              -> https://xxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY -> service_role key (NUNCA la anon/public key aquí; esta corre solo en servidor)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const { name, phone, email, agency, website } = req.body || {};

  // Honeypot: si el campo oculto viene lleno, es un bot. Respondemos "ok" sin guardar nada.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'El nombre es obligatorio.' });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ ok: false, error: 'El teléfono es obligatorio.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'El correo no es válido.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan variables de entorno de Supabase');
    return res.status(500).json({ ok: false, error: 'El sistema no está configurado todavía. Avisa a JD.' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify([
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          agency: agency ? agency.trim() : null,
          source: 'evento_2_sep'
        }
      ])
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error de Supabase:', text);
      return res.status(500).json({ ok: false, error: 'No se pudo guardar. Intenta de nuevo.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo guardar. Intenta de nuevo.' });
  }
}
