import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-6">
        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>Eliminar</button>
      </div>
    </Modal>
  );
}
