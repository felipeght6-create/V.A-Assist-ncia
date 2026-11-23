import React, { useEffect, useRef, useState } from 'react';
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
  const emitDate = formatDateBR(today);
  const validDays = order.validityDays || store.defaultValidityDays || 7;
  const warrantyDays = order.warrantyDays || store.defaultWarrantyDays || 90;
  const warrantyStart = order.warrantyStartDate || today;
  const warrantyEnd =
    order.warrantyEndDate || addDaysYMD(warrantyStart, warrantyDays);

  const extraRowCount =
    (order.freeScreenProtector ? 1 : 0) + 1; // +1 for pickup delivery line

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
            {/* Dark Top Header Band */}
            <div className="bg-[#0f172a] text-white px-9 py-5 border-b-4 border-[#0ea5e9]">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      referrerPolicy="no-referrer"
                      className="w-18 h-18 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-display font-bold text-xl shrink-0">
                      VA
                    </div>
                  )}
                  <div className="space-y-0.5 min-w-0">
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
                      {store.cnpjCpf && store.phone && (
                        <span className="mx-2 text-slate-500">·</span>
                      )}
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
                <div className="text-right shrink-0 space-y-0.5">
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
                    Válido até {formatDateBR(addDaysYMD(today, validDays))}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-9 pt-4 pb-4 space-y-4">
              {/* Client & Equipment Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                  DADOS DO CLIENTE &amp; EQUIPAMENTO
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500">Cliente</p>
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
                    <p className="text-[10px] text-slate-500">Telefone / WhatsApp</p>
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
                    <p className="text-[10px] text-slate-500">Aparelho / Equipamento</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {order.deviceBrandModel || '—'}
                    </p>
                    {order.reportedIssue && (
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                        {order.reportedIssue}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1: Levantamento de Serviços e Peças */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0ea5e9] shrink-0" />
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    1. Levantamento de Serviços, Telas, Cortesia e Deslocamento
                  </h3>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-white text-[10.5px] font-bold">
                        <th className="py-2 px-3">Serviço / Peça / Condição</th>
                        <th className="py-2 px-2 text-center w-12">Qtd</th>
                        <th className="py-2 px-2.5 text-right w-24">Peças</th>
                        <th className="py-2 px-2.5 text-right w-28">Mão de Obra</th>
                        <th className="py-2 px-3 text-right w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11.5px] divide-y divide-slate-200 bg-white">
                      {order.items.length === 0 && !order.freeScreenProtector && pickupFee === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-5 text-center text-slate-400">
                            Nenhum serviço ou tela adicionado até o momento.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {order.items.map((item, idx) => {
                            const qty = Math.max(1, Number(item.qty) || 1);
                            const partSub = (Number(item.partPrice) || 0) * qty;
                            const laborSub = (Number(item.laborPrice) || 0) * qty;
                            const lineSub = partSub + laborSub;
                            return (
                              <tr
                                key={item.id}
                                className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                              >
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {item.name}
                                </td>
                                <td className="py-2 px-2 text-center font-num text-slate-700">
                                  {qty}
                                </td>
                                <td className="py-2 px-2.5 text-right font-num text-slate-700">
                                  {formatBRL(partSub)}
                                </td>
                                <td className="py-2 px-2.5 text-right font-num text-slate-700">
                                  {formatBRL(laborSub)}
                                </td>
                                <td className="py-2 px-3 text-right font-num text-slate-900">
                                  {formatBRL(lineSub)}
                                </td>
                              </tr>
                            );
                          })}

                          {order.freeScreenProtector && (
                            <tr className="bg-emerald-50/70">
                              <td className="py-2 px-3 font-bold text-emerald-800">
                                {FREE_PROTECTOR_DESCRIPTION}
                              </td>
                              <td className="py-2 px-2 text-center font-num text-emerald-800">
                                1
                              </td>
                              <td className="py-2 px-2.5 text-right font-num text-emerald-700">
                                R$ 0,00
                              </td>
                              <td className="py-2 px-2.5 text-right font-num text-emerald-700">
                                Cortesia
                              </td>
                              <td className="py-2 px-3 text-right font-num text-emerald-800">
                                GRÁTIS
                              </td>
                            </tr>
                          )}

                          <tr className="bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {pickupFee > 0
                                ? 'Deslocamento — Busca do aparelho no endereço do cliente'
                                : 'Deslocamento (Busca do aparelho) — Sem cobrança'}
                            </td>
                            <td className="py-2 px-2 text-center font-num text-slate-700">
                              1
                            </td>
                            <td className="py-2 px-2.5 text-right font-num text-slate-500">
                              —
                            </td>
                            <td className="py-2 px-2.5 text-right font-num text-slate-500">
                              —
                            </td>
                            <td className="py-2 px-3 text-right font-num text-slate-900">
                              {pickupFee > 0 ? formatBRL(pickupFee) : 'GRÁTIS'}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-200 text-xs text-slate-800">
                        <td className="py-2 px-3 font-bold" colSpan={2}>
                          TOTAIS ({order.items.length + extraRowCount - 1}{' '}
                          {order.items.length + extraRowCount - 1 === 1 ? 'item' : 'itens'} + deslocamento)
                        </td>
                        <td className="py-2 px-2.5 text-right font-num">
                          {formatBRL(totals.partsSubtotal)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-num">
                          {formatBRL(totals.laborSubtotal)}
                        </td>
                        <td className="py-2 px-3 text-right font-num text-sm text-slate-900">
                          {formatBRL(totals.grossSubtotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 2: Opções de Investimento e Pagamento */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0ea5e9] shrink-0" />
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    2. Opções de Investimento e Pagamento
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Left Dark Card: Pagamento à Vista */}
                  <div className="rounded-2xl bg-[#0f172a] border-2 border-[#0ea5e9] text-white p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-[#38bdf8] uppercase">
                        PAGAMENTO À VISTA (PIX / DINHEIRO)
                      </p>
                      <p className="font-num text-3xl text-white mt-1.5">
                        {formatBRL(totals.cashTotal)}
                      </p>
                      {totals.cashDiscountPercent > 0 && (
                        <p className="text-[10.5px] text-[#7dd3fc] font-num mt-0.5">
                          Desconto à vista de {totals.cashDiscountPercent}% (-
                          {formatBRL(totals.cashDiscountAmount)})
                          {pickupFee > 0 ? ` + Deslocamento ${formatBRL(pickupFee)}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 text-[10.5px] text-slate-300 space-y-0.5">
                      <p>Valor final completo para pagamento via PIX ou dinheiro.</p>
                      {store.pixKey && (
                        <p className="text-slate-200">
                          Chave PIX: <strong className="font-num">{store.pixKey}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right White Card: Cartão de Crédito — Parcela em Evidência */}
                  <div className="rounded-2xl bg-white border-2 border-slate-800 text-slate-900 p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-slate-600 uppercase">
                        NO CARTÃO DE CRÉDITO ({totals.selectedInstallment.installments}x
                        {order.cardMode === 'sem_juros' ? ' SEM JUROS' : ''})
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                        <span className="font-num text-3xl text-slate-900">
                          {formatBRL(totals.selectedInstallment.perInstallment)}
                        </span>
                        <span className="rounded-md bg-sky-100 border border-sky-300 px-2 py-0.5 text-xs text-slate-900 font-num">
                          em {totals.selectedInstallment.installments}x
                          {order.cardMode === 'sem_juros' ? ' sem juros' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-num mt-1">
                        Total no cartão: {formatBRL(totals.selectedInstallment.total)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10.5px] text-slate-600">
                      <p>
                        Parcelamento em {totals.selectedInstallment.installments}x
                        {order.cardMode === 'sem_juros' ? ' sem juros' : ''} no cartão de crédito.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 90-Day Legal Warranty Box + Technical Observations */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-[10.5px] text-slate-700 leading-snug">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                  <p className="font-bold text-slate-900 text-[11px]">
                    GARANTIA DE <span className="font-num">{warrantyDays} DIAS</span> — REGISTRO E CONDIÇÕES LEGAIS
                  </p>
                  <p className="font-num text-[10.5px] text-slate-800">
                    Instalação: {formatDateBR(warrantyStart)} · Término: {formatDateBR(warrantyEnd)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <p className="font-bold text-emerald-800 mb-0.5">A garantia cobre:</p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-slate-700">
                      {SCREEN_WARRANTY_COVERAGE.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-rose-800 mb-0.5">A garantia não cobre:</p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-slate-700">
                      {SCREEN_WARRANTY_EXCLUSIONS.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {order.technicianNotes && (
                  <p className="pt-1 border-t border-slate-200 text-[10px]">
                    <strong className="text-slate-900">Observações Técnicas:</strong>{' '}
                    {order.technicianNotes}
                  </p>
                )}

                <p className="text-[9.5px] text-slate-500">
                  {SCREEN_WARRANTY_LEGAL_NOTE}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="px-9 pb-5 pt-1">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-t border-slate-300 pt-1 text-[10.5px] font-semibold text-slate-600">
                  {store.name || 'V.A Assistência'} — Técnico Responsável
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-300 pt-1 text-[10.5px] font-semibold text-slate-600">
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
