import { getGeminiClient, cleanJsonResponse } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, style = 'modern' } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert system architect and diagram designer.
Create a complete, beautifully structured, professional flowchart for the user's description.
Format: JSON with title, description, direction ('top-down' or 'left-right'), nodes list, and edges list.
Canvas coordinates should be spaced nicely (X 100-1400, Y 80-1000). Nodes should have width 180-220, height 70-95.
Make sure to include decision branches (Yes/No, Success/Failure) where appropriate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{}';
    const diagramData = cleanJsonResponse(text);

    return res.status(200).json({
      success: true,
      diagram: diagramData,
    });
  } catch (error: any) {
    console.error('Error generating flowchart in serverless function:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate flowchart',
    });
  }
}
