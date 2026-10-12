import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Allow large payloads for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to initialize Gemini client with required headers
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Clean JSON response from model
function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

// Analyze image / diagram to structured flowchart
app.post('/api/analyze-diagram', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', additionalInstructions } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    // Strip data URL prefix if present
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

    return res.json({
      success: true,
      diagram: diagramData,
    });
  } catch (error: any) {
    console.error('Error analyzing diagram with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze diagram image',
      details: error.toString(),
    });
  }
});

// Generate flowchart from text description or expand existing flow
app.post('/api/generate-flowchart', async (req, res) => {
  try {
    const { prompt, style = 'modern' } = req.body;

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

    return res.json({
      success: true,
      diagram: diagramData,
    });
  } catch (error: any) {
    console.error('Error generating flowchart with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate flowchart',
    });
  }
});

// AI Diagram Assistant / Refiner: Suggest improvements or add edge/branch
app.post('/api/refine-flowchart', async (req, res) => {
  try {
    const { currentDiagram, request } = req.body;
    if (!currentDiagram || !request) {
      return res.status(400).json({ error: 'Missing currentDiagram or request' });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    return res.json({
      success: true,
      diagram: updatedDiagram,
    });
  } catch (error: any) {
    console.error('Error refining flowchart:', error);
    return res.status(500).json({
      error: error.message || 'Failed to refine flowchart',
    });
  }
});

// Vite middleware in dev or static files in production
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[DiagramForge] Server running on http://0.0.0.0:${port}`);
});
