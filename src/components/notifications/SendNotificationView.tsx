import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Loader2, Send, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendClassNotification } from '../../lib/notifications';

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
  studentCount: number;
}

interface ClassListResponse {
  status: string;
  classes: ClassOption[];
}

const TITLE_MAX = 120;
const MESSAGE_MAX = 1000;

async function readErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();
        if (payload && typeof payload.message === 'string' && payload.message) {
          return payload.message;
        }
      } catch {
        // fall back below
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to load classes';
}

const classLabel = (cls: ClassOption) =>
  cls.section ? `${cls.name} · ${cls.section}` : cls.name;

export const SendNotificationView: React.FC = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);

      const { data, error } = await supabase.functions.invoke<ClassListResponse>('class-list', {
        method: 'GET',
      });

      if (cancelled) return;

      if (error || data?.status !== 'ok' || !Array.isArray(data.classes)) {
        setClasses([]);
        setClassesError(error ? await readErrorMessage(error) : 'Failed to load classes');
        setClassesLoading(false);
        return;
      }

      setClasses(data.classes);
      setSelectedClassId((prev) => prev || data.classes[0]?.id || '');
      setClassesLoading(false);
    };

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const canSend =
    !!selectedClassId && !!trimmedTitle && !!trimmedMessage && !isSending;

  const openConfirm = () => {
    if (!canSend) return;
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsConfirmOpen(true);
  };

  const handleSend = async () => {
    if (!canSend || !selectedClass) return;

    setIsSending(true);
    setErrorMessage(null);

    const { error } = await sendClassNotification(selectedClassId, trimmedTitle, trimmedMessage);

    setIsSending(false);
    setIsConfirmOpen(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setSuccessMessage(`Sent to ${classLabel(selectedClass)}`);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6 pb-24 font-sans max-w-3xl mx-auto text-[#14201B]">
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#E5F5EE] border border-[#12A176]/30 text-[#12A176] text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#14201B] text-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm border border-[#DCEAE3]">
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#12A176] shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Send notification</h2>
            <p className="text-xs text-white/70 font-medium mt-1 max-w-xl">
              Send one message to every student in one of your classes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#DCEAE3] shadow-sm space-y-5">
        {classesLoading ? (
          <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#5C6B63] font-medium flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#12A176] animate-spin" />
            Loading classes.
          </div>
        ) : classesError ? (
          <div className="p-4 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words">{classesError}</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#5C6B63] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E0A23B]" />
            No classes found.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#5C6B63] mb-1.5 ml-1">
                Class
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#5C6B63] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSuccessMessage(null);
                  }}
                  disabled={isSending}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] disabled:opacity-60 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {classLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#5C6B63]">
                  Title
                </label>
                <span className="text-[10px] font-bold text-[#5C6B63]">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSuccessMessage(null);
                }}
                disabled={isSending}
                placeholder="e.g. Class cancelled today"
                className="w-full px-4 py-2.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold text-[#14201B] placeholder:text-[#5C6B63]/60 focus:outline-none focus:border-[#12A176] disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#5C6B63]">
                  Message
                </label>
                <span className="text-[10px] font-bold text-[#5C6B63]">
                  {message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                value={message}
                maxLength={MESSAGE_MAX}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSuccessMessage(null);
                }}
                disabled={isSending}
                rows={5}
                placeholder="Write the message students will see..."
                className="w-full px-4 py-3 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold text-[#14201B] placeholder:text-[#5C6B63]/60 focus:outline-none focus:border-[#12A176] resize-y disabled:opacity-60"
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{errorMessage}</span>
              </div>
            )}

            <button
              onClick={openConfirm}
              disabled={!canSend}
              className="w-full py-2.5 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {isConfirmOpen && selectedClass && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#DCEAE3] shadow-xl space-y-4"
            >
              <h3 className="font-bold text-base text-[#14201B]">Send notification?</h3>
              <p className="text-xs text-[#5C6B63]">
                Send this to all students of <strong>{classLabel(selectedClass)}</strong>? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-[#F8FDFB] text-[#5C6B63] font-bold text-xs border border-[#DCEAE3] disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-[#12A176] text-white font-bold text-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
