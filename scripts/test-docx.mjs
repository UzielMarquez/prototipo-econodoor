import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ShadingType, BorderStyle } from 'docx';
import fs from 'fs';

console.log("docx imports OK!");
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "Test docx",
        heading: HeadingLevel.HEADING_1
      })
    ]
  }]
});

const buf = await Packer.toBuffer(doc);
console.log("Packer buffer size:", buf.length);
