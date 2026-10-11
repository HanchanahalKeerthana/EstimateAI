
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server AI key is not configured.'
    });
  }

  try {
    const body = req.body;

    if (!body || !Array.isArray(body.contents)) {
      return res.status(400).json({
        error: 'A valid Gemini request is required.'
      });
    }

    const requestText = JSON.stringify(body);

    if (requestText.length > 50000) {
      return res.status(413).json({
        error: 'The AI request is too large.'
      });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: requestText
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || 'Gemini request failed.'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Gemini API error:', error);

    return res.status(500).json({
      error: 'Unable to process the AI request.'
    });
  }
}
