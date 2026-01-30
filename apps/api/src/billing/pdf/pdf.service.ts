import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ObjectStorageService } from '../../object-storage/object-storage.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly objectStorageService: ObjectStorageService) {}

  private async fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
    try {
      // Check if this is an S3 path (stored as key in database)
      if (imageUrl && !imageUrl.startsWith('http')) {
        // It's an S3 key, fetch directly from S3
        return await this.objectStorageService.getObjectBuffer(imageUrl);
      } else if (imageUrl && imageUrl.startsWith('http')) {
        // It's a full URL - could be a signed URL or external URL
        // Fetch using native fetch
        const response = await fetch(imageUrl);
        if (!response.ok) {
          this.logger.warn(`Failed to fetch image from URL: ${imageUrl}`);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      return null;
    } catch (error) {
      this.logger.error(`Error fetching image: ${error}`);
      return null;
    }
  }

  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // ===== HEADER =====
    if (data.tenant.logoUrl) {
      try {
        const imgBuffer = await this.fetchImageBuffer(data.tenant.logoUrl);
        if (imgBuffer) {
          doc.image(imgBuffer, 50, 45, { width: 100 });
        } else {
          doc.rect(50, 45, 100, 50).fill('#e5e5e5');
        }
      } catch (error) {
        this.logger.warn(`Failed to load logo image: ${error}`);
        doc.rect(50, 45, 100, 50).fill('#e5e5e5');
      }
    } else {
      doc.rect(50, 45, 100, 50).fill('#e5e5e5');
    }

    doc
      .fillColor('#000')
      .fontSize(16)
      .text(data.tenant.name, 200, 50)
      .fontSize(10)
      .text(data.tenant.address ?? '');

    if (data.tenant.email) {
      doc.text(data.tenant.email);
    }
    if (data.tenant.phone) {
      doc.text(data.tenant.phone);
    }

    // ===== INVOICE META =====
    doc.moveDown(2);
    doc.fontSize(20).fillColor('#333').text('INVOICE', { align: 'left' });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#000')
      .text(`Invoice #: ${data.invoice.invoiceNumber}`)
      .text(`Issue Date: ${data.invoice.issueDate.toDateString()}`)
      .text(`Due Date: ${data.invoice.dueDate.toDateString()}`)
      .text(`Status: ${data.invoice.status}`);

    // ===== CUSTOMER =====
    doc.moveDown();
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(data.customer.name);
    if (data.customer.email) doc.text(data.customer.email);
    if (data.customer.address) doc.text(data.customer.address);

    // ===== TABLE =====
    doc.moveDown(2);

    const tableTop = doc.y;
    const colDescription = 50;
    const colQty = 300;
    const colUnit = 370;
    const colTotal = 450;

    // Table header background
    doc.rect(45, tableTop - 5, 510, 20).fill('#f0f0f0');

    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
    doc.text('Description', colDescription, tableTop);
    doc.text('Qty', colQty, tableTop);
    doc.text('Unit Price', colUnit, tableTop);
    doc.text('Total', colTotal, tableTop);

    doc.font('Helvetica');
    let y = tableTop + 25;

    for (const item of data.items) {
      doc.text(item.description, colDescription, y, { width: 240 });
      doc.text(String(item.quantity), colQty, y);
      doc.text(`$${item.unitPrice}`, colUnit, y);
      doc.text(`$${item.totalPrice}`, colTotal, y);
      y += 20;
    }

    // ===== TOTALS =====
    doc.moveDown(2);
    y = doc.y + 20;

    doc.fontSize(10);
    doc.text(`Subtotal:`, 350, y);
    doc.text(`$${data.invoice.subtotal}`, colTotal, y);
    y += 15;

    doc.text(`Tax:`, 350, y);
    doc.text(`$${data.invoice.taxAmount}`, colTotal, y);
    y += 15;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total:`, 350, y);
    doc.text(`$${data.invoice.totalAmount}`, colTotal, y);
    doc.font('Helvetica');

    if (data.invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(data.invoice.notes);
    }

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#666').text('Thank you for your business!', { align: 'center' });

    doc.end();

    return await new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  async generatePaymentReceiptPdf(data: PaymentReceiptPdfData): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // ===== HEADER =====
    if (data.tenant.logoUrl) {
      try {
        const imgBuffer = await this.fetchImageBuffer(data.tenant.logoUrl);
        if (imgBuffer) {
          doc.image(imgBuffer, 50, 45, { width: 100 });
        } else {
          doc.rect(50, 45, 100, 50).fill('#e5e5e5');
        }
      } catch (error) {
        this.logger.warn(`Failed to load logo image: ${error}`);
        doc.rect(50, 45, 100, 50).fill('#e5e5e5');
      }
    } else {
      doc.rect(50, 45, 100, 50).fill('#e5e5e5');
    }

    doc
      .fillColor('#000')
      .fontSize(16)
      .text(data.tenant.name, 200, 50)
      .fontSize(10)
      .text(data.tenant.address ?? '');

    if (data.tenant.email) {
      doc.text(data.tenant.email);
    }
    if (data.tenant.phone) {
      doc.text(data.tenant.phone);
    }

    // ===== RECEIPT TITLE =====
    doc.moveDown(2);
    doc.fontSize(20).fillColor('#333').text('PAYMENT RECEIPT', { align: 'left' });
    doc.moveDown(0.5);

    // ===== PAYMENT META =====
    doc.fontSize(10).fillColor('#000')
      .text(`Receipt #: ${data.payment.receiptNumber}`)
      .text(`Payment Date: ${data.payment.paymentDate.toDateString()}`)
      .text(`Payment Method: ${data.payment.paymentMethod}`)
      .text(`Type: ${data.payment.type}`);

    if (data.payment.referenceNumber) {
      doc.text(`Reference: ${data.payment.referenceNumber}`);
    }

    // ===== CUSTOMER =====
    doc.moveDown();
    doc.fontSize(12).text('Received From:', { underline: true });
    doc.fontSize(10).text(data.customer.name);
    if (data.customer.email) doc.text(data.customer.email);
    if (data.customer.address) doc.text(data.customer.address);

    // ===== APPLIED TO INVOICES =====
    if (data.appliedInvoices && data.appliedInvoices.length > 0) {
      doc.moveDown(2);
      doc.fontSize(12).text('Applied to Invoices:', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const colInvoice = 50;
      const colApplied = 350;

      // Table header background
      doc.rect(45, tableTop - 5, 510, 20).fill('#f0f0f0');

      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
      doc.text('Invoice Number', colInvoice, tableTop);
      doc.text('Amount Applied', colApplied, tableTop);

      doc.font('Helvetica');
      let y = tableTop + 25;

      for (const inv of data.appliedInvoices) {
        doc.text(inv.invoiceNumber, colInvoice, y);
        doc.text(`$${inv.amountApplied}`, colApplied, y);
        y += 20;
      }
    }

    // ===== TOTAL =====
    doc.moveDown(2);
    const totalY = doc.y + 10;

    doc.rect(300, totalY - 10, 250, 40).fill('#f0f0f0');
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold');
    doc.text('Total Amount:', 310, totalY);
    doc.text(`$${data.payment.amount}`, 450, totalY);
    doc.font('Helvetica');

    if (data.payment.notes) {
      doc.moveDown(3);
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(data.payment.notes);
    }

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#666').text('Thank you for your payment!', { align: 'center' });

    doc.end();

    return await new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }
}

export type InvoicePdfData = {
  tenant: {
    name: string
    logoUrl?: string | null
    address?: string
    email?: string
    phone?: string
  }
  invoice: {
    invoiceNumber: string
    issueDate: Date
    dueDate: Date
    status: string
    subtotal: string
    taxAmount: string
    totalAmount: string
    notes?: string
  }
  customer: {
    name: string
    email?: string
    address?: string
  }
  items: {
    description: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }[]
}

export type PaymentReceiptPdfData = {
  tenant: {
    name: string
    logoUrl?: string | null
    address?: string
    email?: string
    phone?: string
  }
  payment: {
    receiptNumber: string
    paymentDate: Date
    paymentMethod: string
    type: string
    amount: string
    referenceNumber?: string | null
    notes?: string | null
  }
  customer: {
    name: string
    email?: string
    address?: string
  }
  appliedInvoices?: {
    invoiceNumber: string
    amountApplied: string
  }[]
}
