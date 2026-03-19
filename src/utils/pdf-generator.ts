import PDFDocument from 'pdfkit';

export interface PdfSection {
    title?: string;
    content?: string;
    table?: {
        headers: string[];
        rows: string[][];
    };
}

export function generatePdf(
    title: string,
    subtitle: string,
    sections: PdfSection[]
): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text(subtitle, { align: 'center' });
    doc.moveDown(1);

    // Separator line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // Sections
    for (const section of sections) {
        if (section.title) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text(section.title);
            doc.moveDown(0.5);
        }

        if (section.content) {
            doc.fontSize(10).font('Helvetica').fillColor('#444444').text(section.content);
            doc.moveDown(0.5);
        }

        if (section.table) {
            drawTable(doc, section.table.headers, section.table.rows);
            doc.moveDown(1);
        }

        doc.moveDown(0.5);
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
            `Generated on ${new Date().toLocaleDateString()} | Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );
    }

    return doc;
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]): void {
    const startX = 50;
    const colWidth = (495) / headers.length;
    const rowHeight = 22;
    let y = doc.y;

    // Header row
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    doc.rect(startX, y, 495, rowHeight).fill('#2563eb');
    headers.forEach((header, i) => {
        doc.fillColor('#ffffff').text(header, startX + i * colWidth + 5, y + 6, {
            width: colWidth - 10,
            height: rowHeight,
        });
    });
    y += rowHeight;

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor('#333333');
    rows.forEach((row, rowIndex) => {
        if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
        }

        const bgColor = rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(startX, y, 495, rowHeight).fill(bgColor);

        row.forEach((cell, i) => {
            doc.fillColor('#333333').text(cell || '-', startX + i * colWidth + 5, y + 6, {
                width: colWidth - 10,
                height: rowHeight,
            });
        });
        y += rowHeight;
    });

    doc.y = y;
}
