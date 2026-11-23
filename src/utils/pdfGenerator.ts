import { jsPDF } from 'jspdf';
import { Client, StoreProfile, WorkOrder } from '../types';
import { addDaysYMD, calculateBudgetTotals, formatBRL, formatDateBR, getTodayYMD } from './format';

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image/')) return src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateBudgetPDF(
  order: WorkOrder,
  client: Client | undefined,
  store: StoreProfile
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const totals = calculateBudgetTotals(
    order.items,
    order.cashDiscountPercent,
    store.cardRates,
    order.selectedInstallments,
    order.cardMode
  );

  const validDays = order.validityDays || store.defaultValidityDays || 7;
  const emitDate = formatDateBR(getTodayYMD());
  const validUntil = formatDateBR(addDaysYMD(getTodayYMD(), validDays));

  // Dark Top Header Band (#0f172a) + Blue Bottom Border (#0ea5e9)
  const headerH = 34;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerH, 'F');
  doc.setFillColor(14, 165, 233);
  doc.rect(0, headerH, pageWidth, 1.4, 'F');

  const logoData = await loadImageAsDataUrl(store.logoUrl);
  const logoSize = 22;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 6, logoSize, logoSize);
    } catch {
      // Ignore logo render failure
    }
  }

  const infoX = logoData ? margin + logoSize + 5 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(store.name || 'V.A Assistência', infoX, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(203, 213, 225);
  const contactText = [
    store.cnpjCpf ? `CNPJ/CPF: ${store.cnpjCpf}` : '',
    store.phone || '',
  ]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(contactText, infoX, 18.5);
  const addrText = [store.address, store.cityState].filter(Boolean).join(' — ');
  if (addrText) {
    doc.setFontSize(7.8);
    doc.setTextColor(148, 163, 184);
    doc.text(addrText, infoX, 23.5);
  }

  // Right Proposal Meta
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248);
  doc.text('PROPOSTA DE ORÇAMENTO', rightX, 11, { align: 'right' });

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(order.code || 'OS-1024', rightX, 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emissão: ${emitDate} · Validade: ${validDays} dias`, rightX, 23.5, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Válido até ${validUntil}`, rightX, 28, { align: 'right' });

  let y = headerH + 8;

  // Client & Equipment Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS DO CLIENTE & EQUIPAMENTO', margin + 4, y + 5.5);

  const c1 = margin + 4;
  const c2 = margin + 66;
  const c3 = margin + 124;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Cliente', c1, y + 11);
  doc.text('Telefone / WhatsApp', c2, y + 11);
  doc.text('Aparelho / Equipamento', c3, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    doc.splitTextToSize(client?.name || 'Cliente não informado', 58)[0] || '',
    c1,
    y + 16
  );
  doc.text(client?.phone || '—', c2, y + 16);
  doc.text(
    doc.splitTextToSize(order.deviceBrandModel || '—', 56)[0] || '',
    c3,
    y + 16
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  if (client?.cpfCnpj) doc.text(client.cpfCnpj, c1, y + 21);
  if (client?.address) {
    doc.text(doc.splitTextToSize(client.address, 54)[0] || '', c2, y + 21);
  }
  if (order.reportedIssue) {
    doc.text(doc.splitTextToSize(order.reportedIssue, 56)[0] || '', c3, y + 21);
  }

  y += 33;

  // Section 1 Header
  doc.setFillColor(14, 165, 233);
  doc.rect(margin, y - 2.7, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Levantamento de Serviços, Peças e Mão de Obra', margin + 4.5, y);

  // Total badge right
  const badgeText = `Total Bruto: ${formatBRL(totals.grossSubtotal)}`;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(125, 211, 252);
  doc.roundedRect(pageWidth - margin - 46, y - 4.5, 46, 6.5, 1.5, 1.5, 'FD');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(badgeText, pageWidth - margin - 23, y - 0.3, { align: 'center' });

  y += 4.5;

  // Table Header (#0f172a)
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  const colDescX = margin + 3.5;
  const colQtyX = margin + 96;
  const colPartX = margin + 123;
  const colLaborX = margin + 153;
  const colTotalX = pageWidth - margin - 3.5;

  doc.text('Serviço / Peça / Acessório', colDescX, y + 5.5);
  doc.text('Qtd', colQtyX, y + 5.5, { align: 'center' });
  doc.text('Peças', colPartX, y + 5.5, { align: 'right' });
  doc.text('Mão de Obra', colLaborX, y + 5.5, { align: 'right' });
  doc.text('Subtotal', colTotalX, y + 5.5, { align: 'right' });

  y += 8.5;

  order.items.forEach((item, index) => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const linePart = (Number(item.partPrice) || 0) * qty;
    const lineLabor = (Number(item.laborPrice) || 0) * qty;
    const lineTotal = linePart + lineLabor;

    const nameLines = doc.splitTextToSize(item.name || 'Item', 86);
    const rowHeight = Math.max(8.5, nameLines.length * 4.2 + 4);

    if (y + rowHeight > pageHeight - 95) {
      doc.addPage();
      y = 18;
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    doc.text(nameLines, colDescX, y + 5.2);
    doc.text(String(qty), colQtyX, y + 5.2, { align: 'center' });
    doc.text(formatBRL(linePart), colPartX, y + 5.2, { align: 'right' });
    doc.text(formatBRL(lineLabor), colLaborX, y + 5.2, { align: 'right' });
    doc.text(formatBRL(lineTotal), colTotalX, y + 5.2, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  if (order.items.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhum serviço ou peça adicionado até o momento.', pageWidth / 2, y + 6, {
      align: 'center',
    });
    y += 10;
  }

  // Table Footer Totals Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  doc.text(`TOTAIS (${order.items.length} itens)`, colDescX, y + 5.5);
  doc.text(formatBRL(totals.partsSubtotal), colPartX, y + 5.5, { align: 'right' });
  doc.text(formatBRL(totals.laborSubtotal), colLaborX, y + 5.5, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatBRL(totals.grossSubtotal), colTotalX, y + 5.5, { align: 'right' });

  y += 15;

  // Section 2 Header
  doc.setFillColor(14, 165, 233);
  doc.rect(margin, y - 2.7, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Opções de Investimento e Pagamento', margin + 4.5, y);

  y += 5;

  // Two Investment Cards (Left Dark Card, Right White Card)
  const payGap = 5;
  const payW = (contentWidth - payGap) / 2;
  const payH = 44;

  // Left Dark Card (À Vista)
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, payW, payH, 3, 3, 'FD');
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(56, 189, 248);
  doc.text('PAGAMENTO À VISTA (PIX / DINHEIRO)', margin + 5, y + 7.5);

  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text(formatBRL(totals.cashTotal), margin + 5, y + 17.5);

  if (totals.cashDiscountPercent > 0) {
    doc.setFontSize(7.8);
    doc.setTextColor(125, 211, 252);
    doc.text(
      `Desconto à vista de ${totals.cashDiscountPercent}% (-${formatBRL(totals.cashDiscountAmount)})`,
      margin + 5,
      y + 23
    );
  }

  doc.setDrawColor(51, 65, 85);
  doc.line(margin + 5, y + 27, margin + payW - 5, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(203, 213, 225);
  doc.text('Valor final completo para pagamento via PIX ou dinheiro.', margin + 5, y + 32.5);
  if (store.pixKey) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Chave PIX: ${store.pixKey}`, margin + 5, y + 38);
  }

  // Right White Card (Cartão de Crédito)
  const cardX = margin + payW + payGap;
  const maxPlan =
    totals.installmentOptions[totals.installmentOptions.length - 1] ||
    totals.selectedInstallment;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardX, y, payW, payH, 3, 3, 'FD');
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`CARTÃO DE CRÉDITO (ATÉ ${maxPlan.installments}x)`, cardX + 5, y + 7.5);

  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  doc.text(formatBRL(totals.selectedInstallment.total), cardX + 5, y + 17.5);

  // Highlighted installment badge
  const instBadge = `ou ${totals.selectedInstallment.installments}x de ${formatBRL(totals.selectedInstallment.perInstallment)}`;
  doc.setFillColor(224, 242, 254);
  doc.setDrawColor(125, 211, 252);
  doc.roundedRect(cardX + 5, y + 20, 56, 5.8, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(instBadge, cardX + 7.5, y + 24);

  doc.setDrawColor(226, 232, 240);
  doc.line(cardX + 5, y + 28.5, cardX + payW - 5, y + 28.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Valor final completo parcelado no cartão de crédito.', cardX + 5, y + 33.5);

  const summaryPlans = [1, 3, 6, 12]
    .map((n) => totals.installmentOptions.find((o) => o.installments === n))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(15, 23, 42);
  const planLine = summaryPlans
    .map((p) => `${p.installments}x ${formatBRL(p.perInstallment)}`)
    .join('  ·  ');
  doc.text(planLine, cardX + 5, y + 39);

  y += payH + 8;

  // Observations & Warranty Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  let obsY = y + 5.5;
  if (order.technicianNotes) {
    const techLines = doc.splitTextToSize(
      `Observações: ${order.technicianNotes}`,
      contentWidth - 8
    );
    doc.text(techLines.slice(0, 2), margin + 4, obsY);
    obsY += techLines.slice(0, 2).length * 3.8 + 1.5;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const termsLines = doc.splitTextToSize(
    `Garantia de ${order.warrantyDays || store.defaultWarrantyDays} dias. ${store.footerNotes || ''}`,
    contentWidth - 8
  );
  doc.text(termsLines.slice(0, 3), margin + 4, obsY);

  // Signatures
  const sigY = pageHeight - 18;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, sigY, margin + 75, sigY);
  doc.line(pageWidth - margin - 75, sigY, pageWidth - margin, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text(store.name || 'V.A Assistência', margin + 37.5, sigY + 4.5, { align: 'center' });
  doc.text(
    client?.name ? `Autorização: ${client.name}` : 'Assinatura do Cliente',
    pageWidth - margin - 37.5,
    sigY + 4.5,
    { align: 'center' }
  );

  const safeCode = (order.code || 'Orcamento').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Orcamento_${safeCode}_VA_Assistencia.pdf`);
}
