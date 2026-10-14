import { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber } from 'docx';
import fs from 'fs';

const doc = new Document({
  sections: [{
    headers: {
      default: new Header({
        children: [new Paragraph({ text: "Header test" })]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun("Pág. "),
              new TextRun({ children: [PageNumber.CURRENT] }),
              new TextRun(" de "),
              new TextRun({ children: [PageNumber.TOTAL_PAGES] })
            ]
          })
        ]
      })
    },
    children: [
      new Paragraph({ text: "Hello world" })
    ]
  }]
});

const buf = await Packer.toBuffer(doc);
console.log("Footer/Header buffer size:", buf.length);
