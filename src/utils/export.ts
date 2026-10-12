import { DiagramData, FlowNode, FlowEdge } from '../types/flowchart';
import { getDiagramBounds, getPortCoordinates, calculateEdgePath } from './geometry';
import { jsPDF } from 'jspdf';

/**
 * Generates standalone SVG code for the diagram
 */
export function generateSvgString(diagram: DiagramData, transparentBg = false): string {
  const bounds = getDiagramBounds(diagram.nodes, 60);
  const width = Math.max(600, Math.ceil(bounds.width));
  const height = Math.max(400, Math.ceil(bounds.height));
  const viewBox = `${bounds.minX} ${bounds.minY} ${width} ${height}`;

  const nodeMap = new Map<string, FlowNode>();
  diagram.nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build edge SVG strings
  let edgesSvg = '';
  for (const edge of diagram.edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const start = getPortCoordinates(fromNode, edge.fromPort);
    const end = getPortCoordinates(toNode, edge.toPort);
    const { path, labelPoint } = calculateEdgePath(
      start,
      end,
      edge.fromPort,
      edge.toPort,
      edge.curveType || 'orthogonal'
    );

    const strokeColor = edge.color || '#64748B';
    const strokeDash =
      edge.style === 'dashed' ? 'stroke-dasharray="6,5"' : edge.style === 'dotted' ? 'stroke-dasharray="3,3"' : '';
    const strokeWidth = edge.strokeWidth || 2;

    edgesSvg += `
    <g class="diagram-edge" data-id="${edge.id}">
      <path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${strokeDash} marker-end="url(#arrow-${edge.id})" stroke-linecap="round" stroke-linejoin="round" />
      ${
        edge.label
          ? `
        <rect x="${labelPoint.x - (edge.label.length * 4.5 + 12)}" y="${labelPoint.y - 12}" width="${
              edge.label.length * 9 + 24
            }" height="24" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
        <text x="${labelPoint.x}" y="${labelPoint.y + 4}" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" text-anchor="middle">${escapeXml(
              edge.label
            )}</text>
      `
          : ''
      }
    </g>`;
  }

  // Build node SVG strings
  let nodesSvg = '';
  for (const node of diagram.nodes) {
    const fill = node.color || '#3B82F6';
    const textColor = node.textColor || '#0F172A';
    const stroke = node.borderColor || '#00000020';
    const w = node.width;
    const h = node.height;
    const x = node.x;
    const y = node.y;

    let shapeSvg = '';

    switch (node.type) {
      case 'start_end':
        shapeSvg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />`;
        break;
      case 'decision':
        const halfW = w / 2;
        const halfH = h / 2;
        const points = `${x + halfW},${y} ${x + w},${y + halfH} ${x + halfW},${y + h} ${x},${y + halfH}`;
        shapeSvg = `<polygon points="${points}" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />`;
        break;
      case 'database':
        const ry = 10;
        shapeSvg = `
          <g>
            <path d="M ${x} ${y + ry} L ${x} ${y + h - ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry} L ${x + w} ${y + ry} Z" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />
            <ellipse cx="${x + w / 2}" cy="${y + ry}" rx="${w / 2}" ry="${ry}" fill="${fill}" fill-opacity="0.25" stroke="${fill}" stroke-width="2" />
            <ellipse cx="${x + w / 2}" cy="${y + h - ry}" rx="${w / 2}" ry="${ry}" fill="none" stroke="${fill}" stroke-width="2" />
          </g>
        `;
        break;
      case 'cloud':
        shapeSvg = `
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${fill}" fill-opacity="0.12" stroke="${fill}" stroke-width="2" stroke-dasharray="4,2" />
        `;
        break;
      case 'io':
        const skew = 18;
        const ioPoints = `${x + skew},${y} ${x + w},${y} ${x + w - skew},${y + h} ${x},${y + h}`;
        shapeSvg = `<polygon points="${ioPoints}" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />`;
        break;
      case 'document':
        shapeSvg = `
          <path d="M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - 14} Q ${x + w * 0.75} ${y + h} ${x + w * 0.5} ${y + h - 8} Q ${x + w * 0.25} ${y + h - 16} ${x} ${y + h - 6} Z" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />
        `;
        break;
      case 'subprocess':
        shapeSvg = `
          <g>
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />
            <line x1="${x + 14}" y1="${y}" x2="${x + 14}" y2="${y + h}" stroke="${fill}" stroke-width="1.5" />
            <line x1="${x + w - 14}" y1="${y}" x2="${x + w - 14}" y2="${y + h}" stroke="${fill}" stroke-width="1.5" />
          </g>
        `;
        break;
      case 'note':
        shapeSvg = `
          <g>
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5" />
            <polygon points="${x + w - 14},${y} ${x + w},${y + 14} ${x + w - 14},${y + 14}" fill="#FDE68A" stroke="#F59E0B" stroke-width="1" />
          </g>
        `;
        break;
      case 'process':
      default:
        shapeSvg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" fill-opacity="0.15" stroke="${fill}" stroke-width="2" />`;
        break;
    }

    const fontSize = node.fontSize || 13;
    const hasSublabel = Boolean(node.sublabel);
    const labelY = hasSublabel ? y + h / 2 - 4 : y + h / 2 + 5;

    nodesSvg += `
    <g class="diagram-node" data-id="${node.id}">
      ${shapeSvg}
      <text x="${x + w / 2}" y="${labelY}" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="middle">${escapeXml(
      node.label
    )}</text>
      ${
        hasSublabel
          ? `<text x="${x + w / 2}" y="${y + h / 2 + 15}" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="400" text-anchor="middle">${escapeXml(
              node.sublabel || ''
            )}</text>`
          : ''
      }
    </g>`;
  }

  // Edge arrow markers
  let markersSvg = '';
  for (const edge of diagram.edges) {
    const color = edge.color || '#64748B';
    markersSvg += `
      <marker id="arrow-${edge.id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${color}" />
      </marker>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
  <defs>
    <style>
      .diagram-node { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
      .diagram-edge { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    </style>
    ${markersSvg}
  </defs>
  ${
    !transparentBg
      ? `<rect x="${bounds.minX}" y="${bounds.minY}" width="${width}" height="${height}" fill="#FAFAFC" />
         <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
           <circle cx="12" cy="12" r="1" fill="#E2E8F0" />
         </pattern>
         <rect x="${bounds.minX}" y="${bounds.minY}" width="${width}" height="${height}" fill="url(#grid)" />`
      : ''
  }
  ${edgesSvg}
  ${nodesSvg}
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download SVG file
 */
export function downloadSvg(diagram: DiagramData, filename?: string) {
  const svgString = generateSvgString(diagram);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || sanitizeFilename(diagram.title) || 'flowchart'}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download PDF file using jsPDF
 */
export async function downloadPdf(diagram: DiagramData, filename?: string): Promise<void> {
  const svgString = generateSvgString(diagram, false);
  const bounds = getDiagramBounds(diagram.nodes, 60);

  // Convert SVG to Canvas image to embed into PDF with high DPI
  const scale = 2; // high resolution
  const width = Math.max(600, Math.ceil(bounds.width));
  const height = Math.max(400, Math.ceil(bounds.height));

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#FAFAFC';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      try {
        const imgData = canvas.toDataURL('image/png');
        const isLandscape = width >= height;

        // Calculate PDF page size
        const doc = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [Math.max(600, width * 0.75), Math.max(400, height * 0.75)],
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

        doc.save(`${filename || sanitizeFilename(diagram.title) || 'flowchart'}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG for PDF conversion'));
    };

    img.src = url;
  });
}

/**
 * Download PNG image
 */
export async function downloadPng(diagram: DiagramData, filename?: string, transparent = false): Promise<void> {
  const svgString = generateSvgString(diagram, transparent);
  const bounds = getDiagramBounds(diagram.nodes, 60);
  const scale = 2;
  const width = Math.max(600, Math.ceil(bounds.width));
  const height = Math.max(400, Math.ceil(bounds.height));

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (!transparent) {
        ctx.fillStyle = '#FAFAFC';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${filename || sanitizeFilename(diagram.title) || 'flowchart'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to generate PNG image'));
    };

    img.src = url;
  });
}

/**
 * Download JSON project state
 */
export function downloadJson(diagram: DiagramData, filename?: string) {
  const jsonStr = JSON.stringify(diagram, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || sanitizeFilename(diagram.title) || 'flowchart'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return (name || 'diagram')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
}
