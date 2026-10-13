import { getGeminiClient, cleanJsonResponse } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/png', additionalInstructions } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const ai = getGeminiClient();

    const systemInstruction = `You are a world-class diagram understanding and reverse-engineering engine.
Your task is to analyze ANY uploaded image — whether it is a hand-drawn whiteboard sketch, hand-drawn paper sketch, screenshot, architecture diagram, flow chart, system map, business workflow, or entity graph.

Extract all nodes and directional connections with maximum accuracy.
Calculate clean layout positions (X and Y coordinates) for the canvas:
- Standard canvas dimensions: width 1400px - 2000px, height 1000px - 1600px.
- Space nodes neatly with 240px to 320px horizontal distance or 140px to 180px vertical distance so edges do not overlap messily.
- Keep standard node dimensions: typically width 180-220, height 70-95 (diamonds/decisions can be 160x100).
- Assign ports ('top', 'bottom', 'left', 'right') to edges naturally based on node flow direction.
- Choose node types:
  - 'start_end': Start, End, Return, Terminate, Launch (pill/oval)
  - 'process': Rectangular action, step, calculation, mutation
  - 'decision': Diamond check, condition, branching question (e.g. "Valid?", "Approved?")
  - 'database': Cylinder database, cache, store, PostgreSQL, Redis, Mongo
  - 'cloud': Cloud service, external API, microservice, SaaS, third-party
  - 'io': Parallelogram user input, payload read, display output, notification
  - 'document': Document, invoice, report, PDF, log file
  - 'subprocess': Double-bordered predefined flow or external module
  - 'note': Sticky note comment or explanation

- Assign theme colors based on role or original visual cues:
  - blue: '#3B82F6' (standard process)
  - emerald/green: '#10B981' (success / start / approved)
  - amber/orange: '#F59E0B' (decision / pending / review)
  - red/rose: '#EF4444' (error / failure / termination / reject)
  - purple: '#8B5CF6' (database / service / auth)
  - sky: '#0EA5E9' (cloud / network / API)
  - slate: '#64748B' (neutral / document / note)

Output valid JSON matching this schema:
{
  "title": "Diagram Title",
  "description": "Brief description of the detected process or flow",
  "direction": "top-down" | "left-right",
  "nodes": [
    {
      "id": "node_1",
      "type": "start_end" | "process" | "decision" | "database" | "cloud" | "io" | "document" | "subprocess" | "note",
      "label": "Primary Label",
      "sublabel": "Optional secondary description or detail",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "color": "hex color string like #3B82F6",
      "icon": "Lucide icon name, e.g. Play, User, CheckCircle, Database, Cloud, AlertCircle, FileText, Send, Lock, Search, RefreshCw, XCircle"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "from": "node_id",
      "to": "node_id",
      "fromPort": "bottom" | "top" | "left" | "right",
      "toPort": "top" | "bottom" | "left" | "right",
      "label": "Optional label like Yes, No, 200 OK, Retry",
      "style": "solid" | "dashed",
      "curveType": "orthogonal" | "smooth" | "straight",
      "color": "#64748B"
    }
  ]
}`;

    const promptText = `Analyze this diagram/image in detail. Detect every block, text label, diamond decision, database, connection, arrow, and label. Reverse engineer it into a clean, beautiful, high-precision editable flowchart JSON structure.
${additionalInstructions ? `User extra guidance: ${additionalInstructions}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/png',
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    const diagramData = cleanJsonResponse(text);

    return res.status(200).json({
      success: true,
      diagram: diagramData,
    });
  } catch (error: any) {
    console.error('Error analyzing diagram with Gemini in serverless function:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze diagram image',
      details: error.toString(),
    });
  }
}
