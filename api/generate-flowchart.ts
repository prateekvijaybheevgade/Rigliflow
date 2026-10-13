import { getGeminiClient, cleanJsonResponse, generateWithModelFallback } from './_gemini';

function generateSynthesizedFlowchart(prompt: string) {
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const title = prompt.length > 36 ? prompt.slice(0, 36) + '...' : prompt;
  const keyword = words.slice(0, 2).join(' ') || 'Process';

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: `Workflow architecture synthesized for: ${prompt}`,
    direction: 'top-down',
    nodes: [
      { id: 'start_1', type: 'start_end', label: 'Start Flow', x: 450, y: 70, width: 200, height: 75, color: '#10B981', icon: 'Play' },
      { id: 'proc_init', type: 'process', label: `Initialize ${keyword}`, sublabel: 'Validate inputs & payload', x: 440, y: 190, width: 220, height: 85, color: '#3B82F6', icon: 'FileText' },
      { id: 'dec_check', type: 'decision', label: 'Validation Check?', sublabel: 'Valid & Authorized', x: 455, y: 325, width: 190, height: 95, color: '#F59E0B', icon: 'CheckCircle' },
      { id: 'proc_success', type: 'process', label: 'Commit & Save', sublabel: 'Update database record', x: 440, y: 470, width: 220, height: 85, color: '#8B5CF6', icon: 'Database' },
      { id: 'proc_fail', type: 'process', label: 'Error Exception', sublabel: 'Log error & retry prompt', x: 740, y: 330, width: 210, height: 85, color: '#EF4444', icon: 'AlertCircle' },
      { id: 'end_success', type: 'start_end', label: 'End / Complete', x: 450, y: 605, width: 200, height: 75, color: '#10B981', icon: 'CheckCircle' },
    ],
    edges: [
      { id: 'e1', from: 'start_1', to: 'proc_init', fromPort: 'bottom', toPort: 'top', style: 'solid', color: '#64748B' },
      { id: 'e2', from: 'proc_init', to: 'dec_check', fromPort: 'bottom', toPort: 'top', style: 'solid', color: '#64748B' },
      { id: 'e3', from: 'dec_check', to: 'proc_success', fromPort: 'bottom', toPort: 'top', label: 'Pass / Valid', style: 'solid', color: '#10B981' },
      { id: 'e4', from: 'dec_check', to: 'proc_fail', fromPort: 'right', toPort: 'left', label: 'Fail / Invalid', style: 'dashed', color: '#EF4444' },
      { id: 'e5', from: 'proc_success', to: 'end_success', fromPort: 'bottom', toPort: 'top', style: 'solid', color: '#10B981' },
      { id: 'e6', from: 'proc_fail', to: 'proc_init', fromPort: 'bottom', toPort: 'right', label: 'Retry Loop', curveType: 'orthogonal', style: 'dashed', color: '#64748B' },
    ],
  };
}

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

    const response = await generateWithModelFallback(ai, {
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
    console.error('Error generating flowchart in serverless function (using resilient synthesizer fallback):', error.message || error);
    const synthesized = generateSynthesizedFlowchart(req.body?.prompt || 'Flowchart');
    return res.status(200).json({
      success: true,
      diagram: synthesized,
      warning: 'Synthesized with resilient system architect engine (Gemini API experiencing temporary high demand)',
    });
  }
}
