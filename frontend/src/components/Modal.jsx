import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[70] p-4"
          >
            <div
              className={`rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} border max-h-[90vh] flex flex-col`}
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
