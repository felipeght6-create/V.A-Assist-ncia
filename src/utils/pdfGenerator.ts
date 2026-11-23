import { jsPDF } from 'jspdf';
import { Client, StoreProfile, WorkOrder } from '../types';
import {
  SCREEN_WARRANTY_COVERAGE,
  SCREEN_WARRANTY_EXCLUSIONS,
  SCREEN_WARRANTY_LEGAL_NOTE,
} from '../data/seed';
import {
  FREE_PROTECTOR_DESCRIPTION,
  addDaysYMD,
  calculateBudgetTotals,
  formatBRL,
  formatDateBR,
  getPickupFeeAmount,
  getTodayYMD,
} from './format';

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
  const margin = 13;
  const contentWidth = pageWidth - margin * 2;

  const pickupFee = getPickupFeeAmount(order.pickupDeliveryFee);
  const totals = calculateBudgetTotals(
    order.items,
    order.cashDiscountPercent,
    store.cardRates,
    order.selectedInstallments,
    order.cardMode,
    pickupFee
  );

  const today = getTodayYMD();
  const validDays = order.validityDays || store.defaultValidityDays || 7;
  const emitDate = formatDateBR(today);
  const validUntil = formatDateBR(addDaysYMD(today, validDays));

  const warrantyDays = order.warrantyDays || store.defaultWarrantyDays || 90;
  const warrantyStart = order.warrantyStartDate || today;
  const warrantyEnd =
    order.warrantyEndDate || addDaysYMD(warrantyStart, warrantyDays);

  // Dark Top Header Band (#0f172a) + Blue Bottom Border (#0ea5e9)
  const headerH = 31;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerH, 'F');
  doc.setFillColor(14, 165, 233);
  doc.rect(0, headerH, pageWidth, 1.3, 'F');

  const logoData = await loadImageAsDataUrl(store.logoUrl);
  const logoSize = 20;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 5.5, logoSize, logoSize);
    } catch {
      // Ignore logo render failure
    }
  }

  const infoX = logoData ? margin + logoSize + 4.5 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(store.name || 'V.A Assistência', infoX, 11.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const contactText = [
    store.cnpjCpf ? `CNPJ/CPF: ${store.cnpjCpf}` : '',
    store.phone || '',
  ]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(contactText, infoX, 17);
  const addrText = [store.address, store.cityState].filter(Boolean).join(' — ');
  if (addrText) {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(addrText, infoX, 22);
  }

  // Right Proposal Meta
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  doc.text('PROPOSTA DE ORÇAMENTO', rightX, 10, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(order.code || 'OS-1024', rightX, 16.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emissão: ${emitDate} · Validade: ${validDays} dias`, rightX, 21.8, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text(`Válido até ${validUntil}`, rightX, 26, { align: 'right' });

  let y = headerH + 6;

  // Client & Equipment Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS DO CLIENTE & EQUIPAMENTO', margin + 4, y + 5);

  const c1 = margin + 4;
  const c2 = margin + 67;
  const c3 = margin + 125;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text('Cliente', c1, y + 9.8);
  doc.text('Telefone / WhatsApp', c2, y + 9.8);
  doc.text('Aparelho / Equipamento', c3, y + 9.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.6);
  doc.setTextColor(15, 23, 42);
  doc.text(
    doc.splitTextToSize(client?.name || 'Cliente não informado', 58)[0] || '',
    c1,
    y + 14.5
  );
  doc.text(client?.phone || '—', c2, y + 14.5);
  doc.text(
    doc.splitTextToSize(order.deviceBrandModel || '—', 56)[0] || '',
    c3,
    y + 14.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  if (client?.cpfCnpj) doc.text(client.cpfCnpj, c1, y + 19.2);
  if (client?.address) {
    doc.text(doc.splitTextToSize(client.address, 54)[0] || '', c2, y + 19.2);
  }
  if (order.reportedIssue) {
    doc.text(doc.splitTextToSize(order.reportedIssue, 56)[0] || '', c3, y + 19.2);
  }

  y += 29;

  // Section 1 Header
  doc.setFillColor(14, 165, 233);
  doc.rect(margin, y - 2.6, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Levantamento de Serviços, Telas, Cortesia e Deslocamento', margin + 4.5, y);

  y += 4;

  // Table Header (#0f172a)
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);

  const colDescX = margin + 3.5;
  const colQtyX = margin + 98;
  const colPartX = margin + 125;
  const colLaborX = margin + 154;
  const colTotalX = pageWidth - margin - 3.5;

  doc.text('Serviço / Peça / Condição', colDescX, y + 5);
  doc.text('Qtd', colQtyX, y + 5, { align: 'center' });
  doc.text('Peças', colPartX, y + 5, { align: 'right' });
  doc.text('Mão de Obra', colLaborX, y + 5, { align: 'right' });
  doc.text('Subtotal', colTotalX, y + 5, { align: 'right' });

  y += 7.5;

  order.items.forEach((item, index) => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const linePart = (Number(item.partPrice) || 0) * qty;
    const lineLabor = (Number(item.laborPrice) || 0) * qty;
    const lineTotal = linePart + lineLabor;

    const nameLines = doc.splitTextToSize(item.name || 'Item', 88);
    const rowHeight = Math.max(7.5, nameLines.length * 3.8 + 3.5);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(15, 23, 42);
    doc.text(nameLines, colDescX, y + 4.8);
    doc.text(String(qty), colQtyX, y + 4.8, { align: 'center' });
    doc.text(formatBRL(linePart), colPartX, y + 4.8, { align: 'right' });
    doc.text(formatBRL(lineLabor), colLaborX, y + 4.8, { align: 'right' });
    doc.text(formatBRL(lineTotal), colTotalX, y + 4.8, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  // Free Screen Protector Row when active
  if (order.freeScreenProtector) {
    const rowH = 7.5;
    doc.setFillColor(236, 253, 245);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(6, 95, 70);
    doc.text(FREE_PROTECTOR_DESCRIPTION, colDescX, y + 5);
    doc.text('1', colQtyX, y + 5, { align: 'center' });
    doc.text('R$ 0,00', colPartX, y + 5, { align: 'right' });
    doc.text('Cortesia', colLaborX, y + 5, { align: 'right' });
    doc.text('GRÁTIS', colTotalX, y + 5, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    y += rowH;
  }

  // Pickup / Displacement Row
  {
    const rowH = 7.5;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text(
      pickupFee > 0
        ? 'Deslocamento — Busca do aparelho no endereço do cliente'
        : 'Deslocamento (Busca do aparelho) — Sem cobrança',
      colDescX,
      y + 5
    );
    doc.text('1', colQtyX, y + 5, { align: 'center' });
    doc.text('—', colPartX, y + 5, { align: 'right' });
    doc.text('—', colLaborX, y + 5, { align: 'right' });
    doc.text(pickupFee > 0 ? formatBRL(pickupFee) : 'GRÁTIS', colTotalX, y + 5, {
      align: 'right',
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    y += rowH;
  }

  // Table Footer Totals Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`TOTAIS (${order.items.length} serviços + deslocamento)`, colDescX, y + 5.2);
  doc.text(formatBRL(totals.partsSubtotal), colPartX, y + 5.2, { align: 'right' });
  doc.text(formatBRL(totals.laborSubtotal), colLaborX, y + 5.2, { align: 'right' });
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text(formatBRL(totals.grossSubtotal), colTotalX, y + 5.2, { align: 'right' });

  y += 13;

  // Section 2 Header
  doc.setFillColor(14, 165, 233);
  doc.rect(margin, y - 2.6, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Opções de Investimento e Pagamento', margin + 4.5, y);

  y += 4.5;

  // Two Investment Cards (Left Dark Card, Right White Card)
  const payGap = 5;
  const payW = (contentWidth - payGap) / 2;
  const payH = 40;

  // Left Dark Card (À Vista)
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, payW, payH, 3, 3, 'FD');
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  doc.text('PAGAMENTO À VISTA (PIX / DINHEIRO)', margin + 5, y + 6.8);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(formatBRL(totals.cashTotal), margin + 5, y + 16);

  if (totals.cashDiscountPercent > 0) {
    doc.setFontSize(7.4);
    doc.setTextColor(125, 211, 252);
    const discTxt =
      pickupFee > 0
        ? `Desconto ${totals.cashDiscountPercent}% (-${formatBRL(totals.cashDiscountAmount)}) + Desloc. ${formatBRL(pickupFee)}`
        : `Desconto à vista de ${totals.cashDiscountPercent}% (-${formatBRL(totals.cashDiscountAmount)})`;
    doc.text(discTxt, margin + 5, y + 21);
  }

  doc.setDrawColor(51, 65, 85);
  doc.line(margin + 5, y + 24.5, margin + payW - 5, y + 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(203, 213, 225);
  doc.text('Valor final completo para pagamento via PIX ou dinheiro.', margin + 5, y + 29.8);
  if (store.pixKey) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Chave PIX: ${store.pixKey}`, margin + 5, y + 35);
  }

  // Right White Card (Cartão de Crédito — Parcela em Evidência)
  const cardX = margin + payW + payGap;
  const semJurosLabel = order.cardMode === 'sem_juros' ? ' sem juros' : '';

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardX, y, payW, payH, 3, 3, 'FD');
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NO CARTÃO DE CRÉDITO (${totals.selectedInstallment.installments}x${order.cardMode === 'sem_juros' ? ' SEM JUROS' : ''})`,
    cardX + 5,
    y + 6.8
  );

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const perInstStr = formatBRL(totals.selectedInstallment.perInstallment);
  doc.text(perInstStr, cardX + 5, y + 16);

  // Highlighted installment condition badge beside/right of value
  const instBadge = `em ${totals.selectedInstallment.installments}x${semJurosLabel}`;
  const perInstW = doc.getTextWidth(perInstStr);
  doc.setFillColor(224, 242, 254);
  doc.setDrawColor(125, 211, 252);
  doc.roundedRect(cardX + 7 + perInstW, y + 10.8, 36, 5.8, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(15, 23, 42);
  doc.text(instBadge, cardX + 9 + perInstW, y + 14.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total no cartão: ${formatBRL(totals.selectedInstallment.total)}`,
    cardX + 5,
    y + 21.5
  );

  doc.setDrawColor(226, 232, 240);
  doc.line(cardX + 5, y + 24.5, cardX + payW - 5, y + 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Parcelamento em ${totals.selectedInstallment.installments}x${semJurosLabel} no cartão de crédito.`,
    cardX + 5,
    y + 30.8
  );

  y += payH + 6;

  // 90-Day Legal Warranty & Observations Box (single-page fitted)
  const sigY = pageHeight - 16;
  const maxBoxH = Math.max(44, sigY - y - 8);
  const boxH = Math.min(58, maxBoxH);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(15, 23, 42);
  doc.text(`GARANTIA DE ${warrantyDays} DIAS — REGISTRO E CONDIÇÕES LEGAIS`, margin + 4, y + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Instalação: ${formatDateBR(warrantyStart)}  ·  Término: ${formatDateBR(warrantyEnd)}`,
    pageWidth - margin - 4,
    y + 5.2,
    { align: 'right' }
  );

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, y + 7.2, pageWidth - margin - 4, y + 7.2);

  const leftColX = margin + 4;
  const rightColX = margin + contentWidth / 2 + 2;
  const colW = contentWidth / 2 - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(6, 95, 70);
  doc.text('A garantia cobre:', leftColX, y + 11.5);

  doc.setTextColor(159, 18, 57);
  doc.text('A garantia não cobre:', rightColX, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.9);
  doc.setTextColor(51, 65, 85);

  let covY = y + 15.2;
  SCREEN_WARRANTY_COVERAGE.forEach((rule) => {
    const lines = doc.splitTextToSize(`• ${rule}`, colW);
    doc.text(lines, leftColX, covY);
    covY += lines.length * 3.3;
  });

  if (order.technicianNotes) {
    covY += 1.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const noteLines = doc.splitTextToSize(`Obs.: ${order.technicianNotes}`, colW);
    doc.text(noteLines.slice(0, 2), leftColX, covY);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  let excY = y + 15.2;
  SCREEN_WARRANTY_EXCLUSIONS.forEach((rule) => {
    const lines = doc.splitTextToSize(`• ${rule}`, colW);
    doc.text(lines, rightColX, excY);
    excY += lines.length * 3.2;
  });

  doc.setFontSize(6.6);
  doc.setTextColor(100, 116, 139);
  const legalLines = doc.splitTextToSize(SCREEN_WARRANTY_LEGAL_NOTE, contentWidth - 8);
  doc.text(legalLines.slice(0, 2), leftColX, y + boxH - 3.5);

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, sigY, margin + 75, sigY);
  doc.line(pageWidth - margin - 75, sigY, pageWidth - margin, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(71, 85, 105);
  doc.text(store.name || 'V.A Assistência', margin + 37.5, sigY + 4.2, { align: 'center' });
  doc.text(
    client?.name ? `Autorização: ${client.name}` : 'Assinatura do Cliente',
    pageWidth - margin - 37.5,
    sigY + 4.2,
    { align: 'center' }
  );

  const safeCode = (order.code || 'Orcamento').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Orcamento_${safeCode}_VA_Assistencia.pdf`);
}
