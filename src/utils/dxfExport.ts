import { CadDrawing, CadEntity } from '../types/omegacad';

/**
 * Pure TypeScript AutoCAD / IntelliCAD standard ASCII DXF (AC1015 / AutoCAD 2000+) generator.
 * Fully compatible with AutoCAD, CMS IntelliCAD, Autodesk DWG TrueView, LibreCAD, Rhino, and Revit.
 */
export function generateDxfString(drawing: CadDrawing): string {
  const lines: string[] = [];

  const add = (groupCode: number | string, value: string | number) => {
    lines.push(String(groupCode).trim());
    lines.push(String(value).trim());
  };

  // 1. HEADER SECTION
  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1015'); // AutoCAD 2000 format (maximum compatibility)
  add(9, '$INSUNITS');
  add(70, drawing.unit === 'm' ? 6 : drawing.unit === 'in' ? 1 : drawing.unit === 'ft' ? 2 : 4); // 4 = Millimeters
  add(9, '$MEASUREMENT');
  add(70, drawing.unit === 'in' || drawing.unit === 'ft' ? 0 : 1); // 1 = Metric, 0 = Imperial
  add(0, 'ENDSEC');

  // 2. TABLES SECTION (Linetypes & Layers)
  add(0, 'SECTION');
  add(2, 'TABLES');

  // Linetype Table
  add(0, 'TABLE');
  add(2, 'LTYPE');
  add(70, 1);
  add(0, 'LTYPE');
  add(2, 'CONTINUOUS');
  add(70, 0);
  add(3, 'Solid line');
  add(72, 65);
  add(73, 0);
  add(40, 0.0);
  add(0, 'ENDTAB');

  // Layer Table
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, drawing.layers.length);

  // Map hex color to AutoCAD Color Index (ACI)
  const hexToAci = (hex?: string): number => {
    if (!hex) return 7; // white
    const clean = hex.toUpperCase();
    if (clean.includes('F43F5E') || clean.includes('RED') || clean.includes('E11D48')) return 1; // Red
    if (clean.includes('F59E0B') || clean.includes('YELLOW') || clean.includes('EAB308')) return 2; // Yellow
    if (clean.includes('10B981') || clean.includes('GREEN') || clean.includes('22C55E')) return 3; // Green
    if (clean.includes('0284C7') || clean.includes('38BDF8') || clean.includes('CYAN')) return 4; // Cyan
    if (clean.includes('3B82F6') || clean.includes('2563EB') || clean.includes('BLUE')) return 5; // Blue
    if (clean.includes('818CF8') || clean.includes('MAGENTA') || clean.includes('C084FC')) return 6; // Magenta
    return 7; // White / Black
  };

  for (const layer of drawing.layers) {
    add(0, 'LAYER');
    add(2, layer.name);
    add(70, 0);
    add(62, hexToAci(layer.color)); // Color index
    add(6, 'CONTINUOUS');
  }
  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  // 3. BLOCKS SECTION (Minimal standard)
  add(0, 'SECTION');
  add(2, 'BLOCKS');
  add(0, 'ENDSEC');

  // 4. ENTITIES SECTION
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  // Scale factor: canvas coordinates (pixels) to millimeters in drawing
  // Default: 1px = 10mm (e.g. 720px wall = 7200mm = 7.2 meters)
  const scaleRatio = 10;

  for (const entity of drawing.entities) {
    const layerObj = drawing.layers.find((l) => l.id === entity.layerId);
    const layerName = layerObj ? layerObj.name : '0';

    // CAD coordinate system: Y goes upwards in standard CAD, whereas SVG goes downwards
    // We invert Y so the floor plan opens right-side up in AutoCAD/IntelliCAD!
    const x1 = entity.x * scaleRatio;
    const y1 = -entity.y * scaleRatio;
    const w = entity.width * scaleRatio;
    const h = entity.height * scaleRatio;
    const x2 = x1 + w;
    const y2 = y1 - h;

    if (entity.type === 'arch_wall') {
      // Draw closed polyline rectangle for the wall
      add(0, 'LWPOLYLINE');
      add(8, layerName);
      add(90, 4); // 4 vertices
      add(70, 1); // 1 = closed
      add(10, x1);
      add(20, y1);
      add(10, x2);
      add(20, y1);
      add(10, x2);
      add(20, y2);
      add(10, x1);
      add(20, y2);

      // Label wall length in CAD
      add(0, 'TEXT');
      add(8, 'A-DIMS');
      add(10, (x1 + x2) / 2);
      add(20, (y1 + y2) / 2 + 80);
      add(40, 120); // Text height in mm
      add(1, entity.label || 'WALL');
    } else if (entity.type === 'arch_door') {
      // Draw door frame line
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, y1);
      add(11, x1);
      add(21, y1 - w);

      // Draw door swing arc
      add(0, 'ARC');
      add(8, layerName);
      add(10, x1); // Center X
      add(20, y1); // Center Y
      add(40, w);  // Radius
      add(50, 270); // Start angle
      add(51, 360); // End angle

      add(0, 'TEXT');
      add(8, layerName);
      add(10, x1 + 40);
      add(20, y1 - w / 2);
      add(40, 100);
      add(1, entity.label || 'D1');
    } else if (entity.type === 'arch_window') {
      // Outer sill line
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, y1);
      add(11, x2);
      add(21, y1);

      // Inner sill line
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, y2);
      add(11, x2);
      add(21, y2);

      // Center glazing line
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, (y1 + y2) / 2);
      add(11, x2);
      add(21, (y1 + y2) / 2);

      add(0, 'TEXT');
      add(8, layerName);
      add(10, (x1 + x2) / 2);
      add(20, y1 + 50);
      add(40, 90);
      add(1, entity.label || 'W1');
    } else if (entity.type === 'arch_column') {
      // Solid column square
      add(0, 'LWPOLYLINE');
      add(8, layerName);
      add(90, 4);
      add(70, 1);
      add(10, x1);
      add(20, y1);
      add(10, x2);
      add(20, y1);
      add(10, x2);
      add(20, y2);
      add(10, x1);
      add(20, y2);

      add(0, 'TEXT');
      add(8, layerName);
      add(10, (x1 + x2) / 2);
      add(20, (y1 + y2) / 2);
      add(40, 80);
      add(1, entity.label || 'C1');
    } else if (entity.type === 'arch_dimension') {
      // Main span line
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, y1);
      add(11, x2);
      add(21, y1);

      // Left tick mark
      add(0, 'LINE');
      add(8, layerName);
      add(10, x1);
      add(20, y1 - 80);
      add(11, x1);
      add(21, y1 + 80);

      // Right tick mark
      add(0, 'LINE');
      add(8, layerName);
      add(10, x2);
      add(20, y1 - 80);
      add(11, x2);
      add(21, y1 + 80);

      // Measurement text callout
      add(0, 'TEXT');
      add(8, layerName);
      add(10, (x1 + x2) / 2 - 200);
      add(20, y1 + 40);
      add(40, 140);
      add(1, entity.dimensionText || entity.label || `${(w / 1000).toFixed(2)} m`);
    } else if (entity.type === 'arch_room') {
      // Boundary guide line
      add(0, 'LWPOLYLINE');
      add(8, layerName);
      add(90, 4);
      add(70, 1);
      add(10, x1);
      add(20, y1);
      add(10, x2);
      add(20, y1);
      add(10, x2);
      add(20, y2);
      add(10, x1);
      add(20, y2);

      // Room Name
      add(0, 'TEXT');
      add(8, layerName);
      add(10, (x1 + x2) / 2 - 250);
      add(20, (y1 + y2) / 2 + 50);
      add(40, 180);
      add(1, entity.label || 'ROOM');

      // Room Area
      if (entity.roomArea) {
        add(0, 'TEXT');
        add(8, layerName);
        add(10, (x1 + x2) / 2 - 200);
        add(20, (y1 + y2) / 2 - 120);
        add(40, 110);
        add(1, entity.roomArea);
      }
    } else {
      // Generic entity box
      add(0, 'LWPOLYLINE');
      add(8, layerName);
      add(90, 4);
      add(70, 1);
      add(10, x1);
      add(20, y1);
      add(10, x2);
      add(20, y1);
      add(10, x2);
      add(20, y2);
      add(10, x1);
      add(20, y2);

      add(0, 'TEXT');
      add(8, layerName);
      add(10, (x1 + x2) / 2);
      add(20, (y1 + y2) / 2);
      add(40, 100);
      add(1, entity.label);
    }
  }

  add(0, 'ENDSEC');
  add(0, 'EOF');

  return lines.join('\n');
}

/**
 * Downloads the drawing as a standard .dxf file in the user's browser
 */
export function downloadDxf(drawing: CadDrawing, filename?: string) {
  const dxfContent = generateDxfString(drawing);
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${drawing.title.replace(/\s+/g, '_')}_CAD.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
