/**
 * ai-proxy.js — שכבת ביניים בין האפליקציה לאנתרופיק
 *
 * האפליקציה שולחת בקשות לכתובת /.netlify/functions/ai-proxy
 * הפונקציה הזו מוסיפה את המפתח הסודי ומעבירה לאנתרופיק
 * המפתח הסודי שמור בהגדרות ניטפליי — לא בקוד
 */

export default async (req, context) => {
  // אפשר רק POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'שיטה לא נתמכת' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // בדוק שיש מפתח סודי מוגדר בסביבת ניטפליי
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'מפתח API לא מוגדר בשרת' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'גוף הבקשה אינו תקין' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // הגבלות בטיחות — מונע שימוש לרעה
  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'בקשה לא תקינה' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // מגביל מספר הודעות בשיחה אחת (מניעת עלויות גבוהות)
  if (body.messages.length > 40) {
    return new Response(JSON.stringify({ error: 'שיחה ארוכה מדי, אנא התחילי שיחה חדשה' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // העבר לאנתרופיק — הוסף את המפתח הסודי כאן בשרת
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: Math.min(body.max_tokens || 1000, 2000), // הגבלה מקסימלית
        system: body.system || '',
        messages: body.messages,
      }),
    });

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: {
        'Content-Type': 'application/json',
        // CORS — מאפשר רק מהאתר שלנו
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'שגיאה בהתחברות לשרת AI' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: '/api/ai',
};
