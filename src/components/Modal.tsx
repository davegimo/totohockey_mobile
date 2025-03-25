import React, { useEffect, useRef } from 'react';
import '../styles/Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'OK',
  showCancel = false,
  cancelText = 'Annulla'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Chiude il modal quando si clicca al di fuori di esso
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Impedisci lo scroll del body quando il modal è aperto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Ripristina lo scroll quando il modal è chiuso
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Gestisce il tasto Escape per chiudere il modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        {title && <div className="modal-header">{title}</div>}
        <div className="modal-content">{children}</div>
        <div className="modal-footer">
          {showCancel && (
            <button className="modal-button cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className="modal-button confirm" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal; 