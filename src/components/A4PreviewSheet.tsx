import React, { useEffect, useRef, useState } from 'react';
import { Client, StoreProfile, WorkOrder } from '../types';
import {
  addDaysYMD,
  calculateBudgetTotals,
  formatBRL,
  formatDateBR,
  getTodayYMD,
} from '../utils/format';

interface A4PreviewSheetProps {
  order: WorkOrder;
  client?: Client;
  store: StoreProfile;
}

const A4_WIDTH_PX = 794; // ~210mm at 96dpi
const A4_HEIGHT_PX = 1123; // ~297mm at 96dpi

export const A4PreviewSheet: React.FC<A4PreviewSheetProps> = ({
  order,
  client,
  store,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      if (availableWidth > 0) {
        const nextScale = Math.min(1, availableWidth / A4_WIDTH_PX);
        setScale(nextScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const totals = calculateBudgetTotals(
    order.items,
    order.cashDiscountPercent,
    store.cardRates,
    order.selectedInstallments,
    order.cardMode
  );

  const emitDate = formatDateBR(getTodayYMD());
  const validDays = order.validityDays || store.defaultValidityDays || 7;
  const maxInstallmentPlan =
    totals.installmentOptions[totals.installmentOptions.length - 1] ||
    totals.selectedInstallment;
  const quickInstallments = [1, 3, 6, 12]
    .map((n) => totals.installmentOptions.find((o) => o.installments === n))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div
        className="mx-auto origin-top-left"
        style={{
          width: `${A4_WIDTH_PX * scale}px`,
          height: `${A4_HEIGHT_PX * scale}px`,
        }}
      >
        <div
          className="print-only-sheet bg-white text-slate-900 shadow-lg border border-slate-200 flex flex-col justify-between relative"
          style={{
            width: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div>
            {/* Dark Top Header Band matching Reference A4 */}
            <div className="bg-[#0f172a] text-white px-10 py-6 border-b-4 border-[#0ea5e9]">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-display font-bold text-xl shrink-0">
                      VA
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <h2 className="font-display text-2xl font-extrabold text-white leading-tight truncate">
                      {store.name || 'V.A Assistência'}
                    </h2>
                    <p className="text-xs text-slate-300">
                      {store.cnpjCpf && (
                        <>
                          <span>CNPJ/CPF: </span>
                          <span className="text-[#38bdf8] font-num">{store.cnpjCpf}</span>
                        </>
                      )}
                      {store.cnpjCpf && store.phone && <span className="mx-2 text-slate-500">·</span>}
                      {store.phone && <span className="font-num">{store.phone}</span>}
                    </p>
                    {(store.address || store.cityState) && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {[store.address, store.cityState].filter(Boolean).join(' — ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Document Proposal Meta */}
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-[11px] font-bold tracking-wider text-[#38bdf8] uppercase">
                    PROPOSTA DE ORÇAMENTO
                  </p>
                  <p className="font-num text-2xl font-bold text-white leading-none">
                    {order.code || 'OS-1024'}
                  </p>
                  <p className="text-[11px] text-slate-300 pt-1 font-num">
                    Emissão: {emitDate} · Validade: {validDays} dias
                  </p>
                  <p className="text-[10px] text-slate-400 font-num">
                    Válido até {formatDateBR(addDaysYMD(getTodayYMD(), validDays))}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-10 pt-6 pb-6 space-y-6">
              {/* Client & Equipment Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[10.5px] font-bold tracking-wider text-slate-500 uppercase mb-3">
                  DADOS DO CLIENTE &amp; EQUIPAMENTO
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10.5px] text-slate-500">Cliente</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {client?.name || 'Cliente não informado'}
                    </p>
                    {client?.cpfCnpj && (
                      <p className="text-[11px] text-slate-500 font-num mt-0.5">
                        {client.cpfCnpj}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10.5px] text-slate-500">Telefone / WhatsApp</p>
                    <p className="text-sm font-num text-slate-900 mt-0.5">
                      {client?.phone || '—'}
                    </p>
                    {client?.address && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {client.address}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10.5px] text-slate-500">Aparelho / Equipamento</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {order.deviceBrandModel || '—'}
                    </p>
                    {order.reportedIssue && (
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {order.reportedIssue}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1: Levantamento de Serviços e Peças */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0ea5e9] shrink-0" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      1. Levantamento de Serviços, Peças e Mão de Obra
                    </h3>
                  </div>

                  <div className="rounded-lg bg-sky-50 border border-sky-300 px-3 py-1 text-xs text-slate-900 font-num">
                    Total Bruto: {formatBRL(totals.grossSubtotal)}
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-white text-[11px] font-bold">
                        <th className="py-2.5 px-3.5">Serviço / Peça / Acessório</th>
                        <th className="py-2.5 px-2 text-center w-14">Qtd</th>
                        <th className="py-2.5 px-3 text-right w-28">Peças</th>
                        <th className="py-2.5 px-3 text-right w-32">Mão de Obra</th>
                        <th className="py-2.5 px-3.5 text-right w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-200 bg-white">
                      {order.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-7 text-center text-slate-400">
                            Nenhum serviço ou peça adicionado até o momento.
                          </td>
                        </tr>
                      ) : (
                        order.items.map((item, idx) => {
                          const qty = Math.max(1, Number(item.qty) || 1);
                          const partSub = (Number(item.partPrice) || 0) * qty;
                          const laborSub = (Number(item.laborPrice) || 0) * qty;
                          const lineSub = partSub + laborSub;
                          return (
                            <tr
                              key={item.id}
                              className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                            >
                              <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-2 text-center font-num text-slate-700">
                                {qty}
                              </td>
                              <td className="py-2.5 px-3 text-right font-num text-slate-700">
                                {formatBRL(partSub)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-num text-slate-700">
                                {formatBRL(laborSub)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-num text-slate-900">
                                {formatBRL(lineSub)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-200 text-xs text-slate-800">
                        <td className="py-2.5 px-3.5 font-bold" colSpan={2}>
                          TOTAIS ({order.items.length}{' '}
                          {order.items.length === 1 ? 'item' : 'itens'})
                        </td>
                        <td className="py-2.5 px-3 text-right font-num">
                          {formatBRL(totals.partsSubtotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-num">
                          {formatBRL(totals.laborSubtotal)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-num text-sm text-slate-900">
                          {formatBRL(totals.grossSubtotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 2: Opções de Investimento e Pagamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0ea5e9] shrink-0" />
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    2. Opções de Investimento e Pagamento
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left Dark Card: Pagamento à Vista */}
                  <div className="rounded-2xl bg-[#0f172a] border-2 border-[#0ea5e9] text-white p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-[#38bdf8] uppercase">
                        PAGAMENTO À VISTA (PIX / DINHEIRO)
                      </p>
                      <p className="font-num text-3xl text-white mt-2">
                        {formatBRL(totals.cashTotal)}
                      </p>
                      {totals.cashDiscountPercent > 0 && (
                        <p className="text-[11px] text-[#7dd3fc] font-num mt-1">
                          Desconto à vista de {totals.cashDiscountPercent}% (-
                          {formatBRL(totals.cashDiscountAmount)})
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                      <p>Valor final completo para pagamento via PIX ou dinheiro.</p>
                      {store.pixKey && (
                        <p className="text-slate-200">
                          Chave PIX: <strong className="font-num">{store.pixKey}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right White Card: Cartão de Crédito */}
                  <div className="rounded-2xl bg-white border-2 border-slate-800 text-slate-900 p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                        CARTÃO DE CRÉDITO (ATÉ {maxInstallmentPlan.installments}x)
                      </p>
                      <p className="font-num text-3xl text-slate-900 mt-2">
                        {formatBRL(totals.selectedInstallment.total)}
                      </p>
                      <div className="mt-2 inline-block rounded-md bg-sky-100 border border-sky-300 px-2.5 py-1 text-xs text-slate-900 font-num">
                        ou {totals.selectedInstallment.installments}x de{' '}
                        {formatBRL(totals.selectedInstallment.perInstallment)}
                        {order.cardMode === 'sem_juros' ? ' sem juros' : ''}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                      <p>Valor final completo parcelado no cartão de crédito.</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10.5px] font-num text-slate-800">
                        {quickInstallments.map((plan) => (
                          <span key={plan.installments}>
                            {plan.installments}x {formatBRL(plan.perInstallment)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observations & Conditions Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                {order.technicianNotes && (
                  <p>
                    <strong className="text-slate-900">Observações Técnicas:</strong>{' '}
                    {order.technicianNotes}
                  </p>
                )}
                <p>
                  <strong className="text-slate-900">Garantia e Condições:</strong>{' '}
                  Garantia de <span className="font-num text-slate-900">{order.warrantyDays || store.defaultWarrantyDays} dias</span>.{' '}
                  {store.footerNotes}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="px-10 pb-7 pt-2">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-t border-slate-300 pt-1.5 text-[11px] font-semibold text-slate-600">
                  {store.name || 'V.A Assistência'} — Técnico Responsável
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-300 pt-1.5 text-[11px] font-semibold text-slate-600">
                  {client?.name ? `Autorização: ${client.name}` : 'Assinatura do Cliente'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
