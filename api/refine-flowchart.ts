import { getGeminiClient, cleanJsonResponse, generateWithModelFallback } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentDiagram, request } = req.body || {};
    if (!currentDiagram || !request) {
      return res.status(400).json({ error: 'Missing currentDiagram or request' });
    }

    const ai = getGeminiClient();

    const response = await generateWithModelFallback(ai, {
      contents: `Here is the current flowchart JSON:
${JSON.stringify(currentDiagram, null, 2)}

User request for update / refinement:
${request}

Return the updated valid flowchart JSON maintaining the same structure with title, description, direction, nodes, and edges.`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    const updatedDiagram = cleanJsonResponse(text);

    return res.status(200).json({
      success: true,
      diagram: updatedDiagram,
    });
  } catch (error: any) {
    console.error('Error refining flowchart in serverless function:', error);
    return res.status(500).json({
      error: error.message || 'Failed to refine flowchart',
    });
  }
}
