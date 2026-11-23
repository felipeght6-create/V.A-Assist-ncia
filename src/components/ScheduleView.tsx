import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  FileText,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  Client,
  ServiceCategoryId,
} from '../types';
import {
  CATEGORY_LABELS,
  addDaysYMD,
  formatDateBR,
  generateId,
  getTodayYMD,
} from '../utils/format';

interface ScheduleViewProps {
  appointments: Appointment[];
  clients: Client[];
  initialOpenModalCategory?: ServiceCategoryId | null;
  onClearInitialModal?: () => void;
  onSaveAppointment: (apt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment: (id: string) => void;
  onConvertToBudget: (apt: Appointment) => void;
}

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  clients,
  initialOpenModalCategory,
  onClearInitialModal,
  onSaveAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onConvertToBudget,
}) => {
  const today = getTodayYMD();
  const [selectedDate, setSelectedDate] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpenModalCategory));
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [deviceBrandModel, setDeviceBrandModel] = useState('');
  const [category, setCategory] = useState<ServiceCategoryId>(
    initialOpenModalCategory || 'telas'
  );
  const [serviceSummary, setServiceSummary] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('14:00');
  const [notes, setNotes] = useState('');

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const dateStrip = useMemo(() => {
    const days: { ymd: string; label: string; dayNum: string }[] = [];
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 0; i < 7; i++) {
      const ymd = addDaysYMD(today, i);
      const [y, m, d] = ymd.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      days.push({
        ymd,
        label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : weekdayNames[dt.getDay()],
        dayNum: String(d).padStart(2, '0'),
      });
    }
    return days;
  }, [today]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => (selectedDate === 'todos' ? true : a.date === selectedDate))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [appointments, selectedDate]);

  const openNewModal = (presetCat?: ServiceCategoryId) => {
    setEditingApt(null);
    setClientId(clients[0]?.id ?? '');
    setDeviceBrandModel('');
    setCategory(presetCat || 'telas');
    setServiceSummary('');
    setDate(selectedDate !== 'todos' ? selectedDate : today);
    setTime('14:00');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setClientId(apt.clientId);
    setDeviceBrandModel(apt.deviceBrandModel);
    setCategory(apt.category);
    setServiceSummary(apt.serviceSummary);
    setDate(apt.date);
    setTime(apt.time);
    setNotes(apt.notes);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    onClearInitialModal?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: Appointment = {
      id: editingApt ? editingApt.id : generateId('apt'),
      clientId: (clientMap.has(clientId) ? clientId : clients[0]?.id) || '',
      deviceBrandModel: deviceBrandModel.trim() || 'Aparelho não informado',
      category,
      serviceSummary: serviceSummary.trim() || CATEGORY_LABELS[category],
      date,
      time,
      status: editingApt ? editingApt.status : 'agendado',
      notes: notes.trim(),
      linkedOrderId: editingApt?.linkedOrderId,
    };
    onSaveAppointment(record);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Agendamentos
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Organize horários de recebimento, diagnósticos e retiradas de equipamentos
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewModal()}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Horizontal Date Scroller */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-3 sm:p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedDate('todos')}
            className={`min-h-[56px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedDate === 'todos'
                ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            Todos ({appointments.length})
          </button>

          {dateStrip.map((d) => {
            const count = appointments.filter((a) => a.date === d.ymd).length;
            const active = selectedDate === d.ymd;
            return (
              <button
                key={d.ymd}
                type="button"
                onClick={() => setSelectedDate(d.ymd)}
                className={`min-h-[56px] min-w-[68px] px-3 py-1.5 rounded-xl transition-colors flex flex-col items-center justify-center shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                <span className={`text-[11px] ${active ? 'opacity-85' : 'text-[var(--text-muted)]'}`}>
                  {d.label}
                </span>
                <span className="font-num text-sm font-bold tabular-nums">
                  {d.dayNum}
                  {count > 0 && (
                    <span className={`ml-1 text-[10px] ${active ? 'opacity-90' : 'text-[var(--accent-text)]'}`}>
                      ({count})
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-[var(--accent-text)] mx-auto" />
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
            Nenhum agendamento para este período
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Registre um horário para atendimento, diagnóstico no Windows, troca de tela ou entrega de acessório.
          </p>
          <button
            type="button"
            onClick={() => openNewModal()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Horário</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => {
            const client = clientMap.get(apt.clientId);
            return (
              <article
                key={apt.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] tabular-nums">
                    <div className="flex items-center gap-2 font-num font-semibold text-[var(--accent-text)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {formatDateBR(apt.date)} · {apt.time}
                      </span>
                    </div>
                    <span className="font-medium text-[var(--text-secondary)]">
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </span>
                  </div>

                  <div
                    onClick={() => openEditModal(apt)}
                    className="cursor-pointer group"
                  >
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                      {apt.serviceSummary}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {client?.name || 'Cliente'} {client?.phone ? `· ${client.phone}` : ''}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {apt.deviceBrandModel} · {CATEGORY_LABELS[apt.category]}
                    </p>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-2)] rounded-lg px-3 py-2 border border-[var(--border)]">
                      {apt.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {apt.status !== 'concluido' && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStatus(
                            apt.id,
                            apt.status === 'agendado' ? 'confirmado' : 'concluido'
                          )
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-text)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {apt.status === 'agendado' ? 'Confirmar' : 'Concluir'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteAppointment(apt.id)}
                      aria-label="Excluir agendamento"
                      className="min-h-[40px] min-w-[40px] rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onConvertToBudget(apt)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Gerar OS / Orçamento</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl border border-[var(--border-strong)] max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {editingApt ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
                className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Cliente
                </label>
                <select
                  value={clientMap.has(clientId) ? clientId : (clients[0]?.id ?? '')}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {clients.length === 0 ? (
                    <option value="">Nenhum cliente cadastrado</option>
                  ) : (
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` (${c.phone})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Categoria Principal
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategoryId)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {(Object.keys(CATEGORY_LABELS) as ServiceCategoryId[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Aparelho / Equipamento
                </label>
                <input
                  type="text"
                  required
                  value={deviceBrandModel}
                  onChange={(e) => setDeviceBrandModel(e.target.value)}
                  placeholder="Ex: iPhone 13, Notebook Dell Inspiron..."
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Descrição do Atendimento
                </label>
                <input
                  type="text"
                  required
                  value={serviceSummary}
                  onChange={(e) => setServiceSummary(e.target.value)}
                  placeholder="Ex: Troca de conector de carga / Diagnóstico Windows"
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="px-5 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                Salvar Agendamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
