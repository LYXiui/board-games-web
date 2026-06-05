import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputPath = path.join(root, '書面報告.md');
const outputPath = path.join(root, '書面報告.docx');

function parseInline(text) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun(text.slice(last, m.index)));
    const token = m[0];
    if (token.startsWith('**')) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith('`')) {
      runs.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas' }));
    } else if (token.startsWith('*')) {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
    }
    last = m.index + token.length;
  }
  if (last < text.length) runs.push(new TextRun(text.slice(last)));
  return runs.length ? runs : [new TextRun(text)];
}

function headingLevel(line) {
  if (line.startsWith('### ')) return HeadingLevel.HEADING_3;
  if (line.startsWith('## ')) return HeadingLevel.HEADING_2;
  if (line.startsWith('# ')) return HeadingLevel.HEADING_1;
  return null;
}

function stripHeading(line) {
  return line.replace(/^#{1,3}\s+/, '');
}

function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function parseTableRow(line) {
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-+:?$/.test(c.replace(/\s/g, '')));
}

function buildTable(rows) {
  const dataRows = rows.filter((cells, i) => !(i === 1 && isSeparatorRow(cells)));
  const colCount = dataRows[0]?.length || 1;
  const width = Math.floor(9360 / colCount);

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: dataRows.map(
      (cells, ri) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                width: { size: width, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
                children: [
                  new Paragraph({
                    children: parseInline(cell.replace(/\*\*/g, '').replace(/`/g, '')),
                    alignment: ri === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function mdToDocx(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const children = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '---') {
      i += 1;
      continue;
    }

    if (isTableRow(line)) {
      const tableLines = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(parseTableRow(lines[i]));
        i += 1;
      }
      children.push(buildTable(tableLines));
      continue;
    }

    const hl = headingLevel(line);
    if (hl) {
      children.push(
        new Paragraph({
          heading: hl,
          children: parseInline(stripHeading(line)),
          spacing: { after: 120 },
        }),
      );
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      children.push(
        new Paragraph({
          children: parseInline(line.slice(2)),
          indent: { left: 720 },
          spacing: { after: 120 },
        }),
      );
      i += 1;
      continue;
    }

    const bulletMatch = line.match(/^(\s*)-\s+(.*)$/);
    if (bulletMatch) {
      const depth = Math.floor(bulletMatch[1].length / 2);
      children.push(
        new Paragraph({
          children: parseInline(bulletMatch[2]),
          bullet: { level: depth },
          spacing: { after: 60 },
        }),
      );
      i += 1;
      continue;
    }

    const numMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      children.push(
        new Paragraph({
          children: parseInline(numMatch[1]),
          spacing: { after: 60 },
        }),
      );
      i += 1;
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    children.push(
      new Paragraph({
        children: parseInline(line),
        spacing: { after: 120 },
      }),
    );
    i += 1;
  }

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

const md = fs.readFileSync(inputPath, 'utf8');
const doc = mdToDocx(md);
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
console.log('已產生:', outputPath);
