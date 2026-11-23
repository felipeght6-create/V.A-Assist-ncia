import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  ExternalLink,
  PlusSquare,
  Share,
  Smartphone,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const SHARED_APP_URL =
  'https://ais-pre-bid4udbivx4yft4mgntvux-330695644661.us-east1.run.app';

const DISMISS_STORAGE_KEY = 'va_assistencia_pwa_banner_dismissed_v1';

const InstallGuideModal: React.FC<{
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}> = ({ open, isIOS, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[var(--border-strong)] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="Ícone V.A Assistência"
              className="w-10 h-10 rounded-xl border border-[var(--border)] shrink-0"
            />
            <div>
              <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                {isIOS ? 'Instalar no iPhone / iPad' : 'Instalar no Celular'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Ícone oficial da V.A Assistência na Tela de Início
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar instruções"
            className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!isIOS && (
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                Android (Google Chrome)
              </p>
              <ol className="space-y-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li>1. Abra o link oficial diretamente no Chrome do celular (fora desta prévia).</li>
                <li>2. Toque no menu <strong className="text-[var(--text-primary)]">⋮</strong> (canto superior direito).</li>
                <li>3. Toque em <strong className="text-[var(--text-primary)]">Instalar aplicativo</strong> ou <strong className="text-[var(--text-primary)]">Adicionar à tela inicial</strong>.</li>
              </ol>
            </div>
          )}

          <div className="space-y-3">
            {!isIOS && (
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                iPhone / iPad (Safari)
              </p>
            )}
            <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Abra o link no navegador <strong className="text-[var(--text-primary)]">Safari</strong> do seu iPhone.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  Toque no botão{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]">
                    <Share className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    Compartilhar
                  </span>{' '}
                  na barra inferior do Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  Role para baixo e toque em{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]">
                    <PlusSquare className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    Adicionar à Tela de Início
                  </span>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  Toque em <strong className="text-[var(--text-primary)]">Adicionar</strong>. O aplicativo ficará com o ícone oficial da V.A Assistência no seu celular.
                </span>
              </li>
            </ol>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="no-print mb-4 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs sm:text-sm font-medium flex items-center gap-2.5">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo offline ativo — Seus dados e orçamentos continuam salvos localmente.</span>
    </div>
  );
};

export const PWAInstallSidebarButton: React.FC = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [iosModalOpen, setIosModalOpen] = useState(false);

  if (isInstalled || (!canInstall && !isIOS)) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setIosModalOpen(true);
    }
  };

  return (
    <>
      <div className="p-3 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Instalar App no Dispositivo</span>
        </button>
      </div>
      <InstallGuideModal open={iosModalOpen} isIOS={isIOS} onClose={() => setIosModalOpen(false)} />
    </>
  );
};

export const PWAInstallMobilePrompt: React.FC = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (isInstalled || dismissed || (!canInstall && !isIOS)) {
    return <InstallGuideModal open={iosModalOpen} isIOS={isIOS} onClose={() => setIosModalOpen(false)} />;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setIosModalOpen(true);
    }
  };

  return (
    <>
      <div className="no-print lg:hidden fixed bottom-[72px] left-3 right-3 z-30 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/apple-touch-icon.png"
            alt="V.A Assistência"
            className="w-10 h-10 rounded-xl border border-[var(--border)] shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              Instalar V.A Assistência
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {isIOS ? 'Adicionar ícone à Tela de Início' : 'Atalho oficial no celular'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] text-xs font-semibold hover:bg-[var(--accent-hover)] whitespace-nowrap cursor-pointer"
          >
            {isIOS ? 'Como instalar' : 'Instalar'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar aviso de instalação"
            className="min-h-[36px] min-w-[36px] rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InstallGuideModal open={iosModalOpen} isIOS={isIOS} onClose={() => setIosModalOpen(false)} />
    </>
  );
};

interface PWAAppInstallCardProps {
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  backupMessage?: string | null;
}

export const PWAAppInstallCard: React.FC<PWAAppInstallCardProps> = ({
  onExportBackup,
  onImportBackup,
  backupMessage,
}) => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARED_APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      setIosModalOpen(true);
    }
  };

  return (
    <>
      <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: App no Celular (Android e iPhone) */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <img
              src="/apple-touch-icon.png"
              alt="Ícone oficial V.A Assistência"
              className="w-16 h-16 rounded-2xl border border-[var(--border-strong)] shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  App no Celular (Android e iPhone)
                </h2>
                {isInstalled && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold">
                    Instalado
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Instale na tela inicial com o ícone oficial da V.A Assistência para abrir em tela cheia sem barra de navegador.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Link oficial do aplicativo
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={SHARED_APP_URL}
                aria-label="Link oficial do aplicativo"
                className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="min-h-[38px] px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {canInstall
                    ? 'Instalar Aplicativo Agora'
                    : isIOS
                      ? 'Ver Passo a Passo (iPhone)'
                      : 'Como Instalar no Android / iPhone'}
                </span>
              </button>
            )}
            <a
              href={SHARED_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir Link Direto</span>
            </a>
          </div>
        </div>

        {/* Card 2: Armazenamento Local e Backup */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Armazenamento e Backup
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Seus clientes, serviços, ordens e agendamentos já são salvos automaticamente no aparelho, sem precisar ativar nada.
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3">
            Quer transferir seus dados entre o celular, tablet e computador? Exporte o arquivo de backup abaixo e importe no outro aparelho.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onExportBackup}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onImportBackup(f);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {backupMessage && (
            <p className="text-xs font-semibold text-[var(--accent-text)]">
              {backupMessage}
            </p>
          )}
        </div>
      </div>

      <InstallGuideModal open={iosModalOpen} isIOS={isIOS} onClose={() => setIosModalOpen(false)} />
    </>
  );
};
