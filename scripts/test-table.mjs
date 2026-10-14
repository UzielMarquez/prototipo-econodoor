import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import fs from 'fs';

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
  },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "0F172A", type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: "Columna A", bold: true, color: "FFFFFF" })] })]
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: { fill: "0F172A", type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: "Columna B", bold: true, color: "FFFFFF" })] })]
        })
      ]
    })
  ]
});

const doc = new Document({
  sections: [{
    properties: {},
    children: [table]
  }]
});

const buf = await Packer.toBuffer(doc);
console.log("Table test OK, buffer size:", buf.length);
