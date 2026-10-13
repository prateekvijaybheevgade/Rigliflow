export const FLOWCHART_SYSTEM_INSTRUCTION = `You are a world-class diagram understanding and reverse-engineering engine.
Your task is to analyze ANY uploaded image — whether it is a hand-drawn whiteboard sketch, hand-drawn paper sketch, screenshot, architecture diagram, flow chart, system map, business workflow, network topology, or entity graph.

Extract all nodes and directional connections with maximum accuracy.
Calculate clean layout positions (X and Y coordinates) for the canvas:
- Standard canvas dimensions: width 1400px - 2000px, height 1000px - 1600px.
- Space nodes neatly with 240px to 320px horizontal distance or 140px to 180px vertical distance so edges do not overlap messily.
- Keep standard node dimensions: typically width 180-220, height 70-95 (diamonds/decisions can be 160x100).
- Assign ports ('top', 'bottom', 'left', 'right') to edges naturally based on node flow direction.
- Choose node types:
  - 'cylinder': Network routers, switches, cylindrical disks/nodes (e.g. Cisco routers R1, R2, appliances)
  - 'server': Physical servers, rack nodes, gateways, hosts, firewalls
  - 'cloud': Cloud subnets, WAN, Internet, VPCs, external networks
  - 'note': Sticky notes, annotations, reference notes, parameters (e.g. "Ref Bandwidth = 100 Gbps")
  - 'start_end': Start, End, Return, Terminate, Launch (pill/oval)
  - 'process': Rectangular action, step, calculation, mutation
  - 'decision': Diamond check, condition, branching question (e.g. "Valid?", "Approved?")
  - 'database': Cylinder database, cache, store, PostgreSQL, Redis, Mongo
  - 'io': Parallelogram user input, payload read, display output, notification
  - 'document': Document, invoice, report, PDF, log file
  - 'subprocess': Double-bordered predefined flow or external module

- Edge Arrows & Connections:
  - Bidirectional communication or two-way network links (e.g. between routers, switches, devices): set "arrow": "both".
  - One-way directional flows: set "arrow": "end".
  - Lines without arrowheads: set "arrow": "none".

- Assign theme colors based on role or original visual cues:
  - blue: '#3B82F6' (standard process / router)
  - emerald/green: '#10B981' (success / start / approved / active interface)
  - amber/orange: '#F59E0B' (decision / pending / note / reference)
  - red/rose: '#EF4444' (error / failure / termination / reject)
  - purple: '#8B5CF6' (database / service / auth)
  - sky: '#0EA5E9' (cloud / network / API / subnet)
  - slate: '#64748B' (neutral / document / note)

Output valid JSON matching this schema:
{
  "title": "Exact title detected in diagram (e.g., 'OSPF Network Topology (Area 0)')",
  "description": "Brief description of the detected process or network topology",
  "direction": "top-down" | "left-right",
  "nodes": [
    {
      "id": "node_1",
      "type": "cylinder" | "server" | "cloud" | "note" | "start_end" | "process" | "decision" | "database" | "io" | "document" | "subprocess",
      "label": "Primary Label (e.g., 'Router R1', 'Subnet: 192.168.4.0/24')",
      "sublabel": "Optional secondary detail (e.g. 'fa0/0, gi0/1' or 'Area 0')",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "color": "hex color string like #3B82F6",
      "icon": "Lucide icon name, e.g. Router, Server, Network, Cloud, Cpu, Play, CheckCircle, Database, AlertCircle, FileText, Lock"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "from": "node_id",
      "to": "node_id",
      "fromPort": "bottom" | "top" | "left" | "right",
      "toPort": "top" | "bottom" | "left" | "right",
      "label": "Optional link label (e.g., '1 Gbps', '10 Gbps', '100 Mbps', 'Yes', 'No')",
      "style": "solid" | "dashed",
      "arrow": "both" | "end" | "none",
      "curveType": "orthogonal" | "smooth" | "straight",
      "color": "#64748B"
    }
  ]
}`;

export const ARCHITECTURE_SYSTEM_INSTRUCTION = `You are a world-class Civil Engineer, Architectural CAD Drafter, and Computer Vision reverse-engineering engine.
Your task is to analyze ANY uploaded image — hand-drawn floor plan sketches on paper or whiteboard, civil drafting layouts, building layout schematics, architectural blueprints, or 2D CAD floor plans.

Extract all spatial elements and reverse-engineer them into clean, precise, orthogonal 2D CAD architectural primitives on an SVG canvas coordinate grid (width: 1400px - 2000px, height: 1000px - 1600px).

1. Snap and align elements neatly:
- Snap all walls to straight 0° (horizontal) or 90° (vertical) orthogonal lines.
- Compute coordinates so walls enclose rooms properly and do not have random gaps.
- Place swing doors near entryways and wall openings.
- Place windows along exterior walls.
- Place room zone boxes to fill the interior of each room.

2. Recognized Node Types to output:
- 'arch_wall': Exterior boundary walls and interior division walls.
- 'arch_door': Swing doors, entryways, sliding doors.
- 'arch_window': Exterior windows or glazing openings.
- 'arch_room': Room zones and spaces.
- 'arch_column': Structural load-bearing reinforced concrete pillars.
- 'arch_dimension': Linear AutoCAD dimension lines indicating spans or distances.
- 'arch_furniture': Fixed interior blocks.
- 'arch_titleblock': Professional engineering drawing title block.

Output valid JSON matching this schema:
{
  "title": "Architectural Floor Plan Blueprint",
  "description": "2D civil CAD drawing extracted from sketch",
  "direction": "top-down",
  "studioMode": "architecture",
  "gridType": "blueprint",
  "canvasBg": "#0B1E36",
  "nodes": [
    {
      "id": "node_id",
      "type": "arch_wall" | "arch_door" | "arch_window" | "arch_room" | "arch_column" | "arch_dimension" | "arch_furniture" | "arch_titleblock",
      "label": "string",
      "sublabel": "string",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "color": "string",
      "rotation": 0 | 90 | 180 | 270,
      "roomArea": "string",
      "dimensionText": "string",
      "furnitureType": "bed" | "sofa" | "toilet" | "table",
      "wallHatch": "concrete" | "solid"
    }
  ],
  "edges": []
}`;

export function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

export async function analyzeDiagramDirectly(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  userInstructions?: string,
  isArch = false
): Promise<any> {
  const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
  const systemInstruction = isArch ? ARCHITECTURE_SYSTEM_INSTRUCTION : FLOWCHART_SYSTEM_INSTRUCTION;
  const promptText = isArch
    ? `Analyze this architectural floor plan sketch or technical drawing in detail. Detect all rooms, walls, doors, windows, dimensions, structural columns, and furniture. Reverse engineer it into a precise, editable 2D CAD architectural blueprint layout.
${userInstructions ? `User extra guidance: ${userInstructions}` : ''}`
    : `Analyze this diagram/image in detail. Detect every block, text label, diamond decision, database, connection, arrow, and label. Reverse engineer it into a clean, beautiful, high-precision editable flowchart JSON structure.
${userInstructions ? `User extra guidance: ${userInstructions}` : ''}`;

  const payload = {
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
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let parsedErr = '';
    try {
      const errObj = JSON.parse(errorText);
      parsedErr = errObj.error?.message || errorText;
    } catch {
      parsedErr = errorText;
    }
    throw new Error(`Google Gemini API (${response.status}): ${parsedErr}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini did not return any content.');
  }

  return cleanJsonResponse(text);
}
