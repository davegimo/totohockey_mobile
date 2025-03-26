import React, { useEffect, useRef, useState } from 'react';
import '../styles/InvitoModal.css';

interface InvitoModalProps {
  isOpen: boolean;
  onClose: () => void;
  codiceLega: string;
  nomeLega: string;
  isLinkScaduto: boolean;
  ultimoInvito: string | null;
  onRigeneraLink?: () => Promise<void>;
}

const InvitoModal: React.FC<InvitoModalProps> = ({
  isOpen,
  onClose,
  codiceLega,
  nomeLega,
  isLinkScaduto,
  ultimoInvito,
  onRigeneraLink
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [linkCopiato, setLinkCopiato] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [linkInvito, setLinkInvito] = useState<string>('');
  const [countdown, setCountdown] = useState<{ ore: number; minuti: number; secondi: number } | null>(null);

  // Costruisci il link di invito
  useEffect(() => {
    if (codiceLega) {
      const baseUrl = window.location.origin;
      setLinkInvito(`${baseUrl}/partecipa/${codiceLega}`);
    } else {
      // Se non c'è un codice, mostriamo un messaggio appropriato
      setLinkInvito('Codice di invito non disponibile');
    }
  }, [codiceLega]);

  // Calcola il countdown per la scadenza
  useEffect(() => {
    if (!ultimoInvito || isLinkScaduto) {
      setCountdown(null);
      return;
    }

    const calcolaTempoRimanente = () => {
      const dataUltimoInvito = new Date(ultimoInvito);
      const dataScadenza = new Date(dataUltimoInvito.getTime() + 12 * 60 * 60 * 1000); // 12 ore in millisecondi
      const now = new Date();
      
      // Se la data di scadenza è già passata
      if (dataScadenza <= now) {
        return null;
      }
      
      // Calcola il tempo rimanente
      const diff = dataScadenza.getTime() - now.getTime();
      const ore = Math.floor(diff / (1000 * 60 * 60));
      const minuti = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondi = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { ore, minuti, secondi };
    };

    // Imposta il countdown iniziale
    setCountdown(calcolaTempoRimanente());
    
    // Aggiorna il countdown ogni secondo
    const timer = setInterval(() => {
      const nuovoCountdown = calcolaTempoRimanente();
      setCountdown(nuovoCountdown);
      
      // Se il countdown è arrivato a zero, fermati
      if (!nuovoCountdown) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [ultimoInvito, isLinkScaduto]);

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

  // Reset dello stato quando il modal si apre/chiude
  useEffect(() => {
    if (isOpen) {
      setLinkCopiato(false);
    }
  }, [isOpen]);

  const handleCopiaLink = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      navigator.clipboard.writeText(linkInvito).then(() => {
        setLinkCopiato(true);
        setTimeout(() => setLinkCopiato(false), 3000);
      });
    }
  };

  const handleRigeneraLink = async () => {
    if (onRigeneraLink) {
      setIsLoading(true);
      try {
        await onRigeneraLink();
        // Il codiceLega viene aggiornato automaticamente tramite props
        setLinkCopiato(false); // Reset dello stato di copia quando il link cambia
      } catch (error) {
        console.error('Errore nella rigenerazione del link:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Formatta il countdown in modo leggibile
  const formattaCountdown = () => {
    if (!countdown) return null;
    
    const { ore, minuti, secondi } = countdown;
    
    // Formattazione con zero-padding
    const oreStr = ore.toString().padStart(2, '0');
    const minutiStr = minuti.toString().padStart(2, '0');
    const secondiStr = secondi.toString().padStart(2, '0');
    
    return `${oreStr}:${minutiStr}:${secondiStr}`;
  };

  const formattaCountdownTesto = () => {
    if (!countdown) return null;
    
    const { ore, minuti } = countdown;
    
    let testo = '';
    if (ore > 0) {
      testo += `${ore} ${ore === 1 ? 'ora' : 'ore'}`;
    }
    
    if (minuti > 0 || ore === 0) {
      if (ore > 0) testo += ' e ';
      testo += `${minuti} ${minuti === 1 ? 'minuto' : 'minuti'}`;
    }
    
    return testo;
  };

  if (!isOpen) return null;

  return (
    <div className="invito-modal-overlay">
      <div className="invito-modal-container" ref={modalRef}>
        <div className="invito-modal-header">
          Invita Giocatori a {nomeLega}
        </div>
        <div className="invito-modal-content">
          <p className="invito-modal-descrizione">
            Condividi questo link con i giocatori che vuoi invitare alla tua lega. Il link sarà valido per 12 ore.
          </p>
          
          {isLinkScaduto || !codiceLega ? (
            <div className="invito-modal-scaduto">
              <p>{!codiceLega ? 'Nessun codice di invito generato per questa lega.' : 'Il link di invito è scaduto.'}</p>
              <button 
                className="invito-modal-button rigenera"
                onClick={handleRigeneraLink}
                disabled={isLoading}
              >
                {isLoading ? 'Generazione...' : !codiceLega ? 'Genera Link' : 'Rigenera Link'}
              </button>
            </div>
          ) : (
            <div>
              <div className="invito-modal-link-container">
                <input
                  ref={linkInputRef}
                  type="text"
                  className="invito-modal-link-input"
                  value={linkInvito}
                  readOnly
                />
                <button 
                  className="invito-modal-button copia"
                  onClick={handleCopiaLink}
                >
                  {linkCopiato ? 'Copiato!' : 'Copia'}
                </button>
              </div>
              
              {countdown && (
                <div className="invito-modal-countdown">
                  <div className="invito-modal-countdown-header">
                    <span>Scadenza invito:</span>
                    <span className="invito-modal-countdown-timer">{formattaCountdown()}</span>
                  </div>
                  <div className="invito-modal-countdown-text">
                    Questo link scadrà tra {formattaCountdownTesto()}.
                  </div>
                  <button 
                    className="invito-modal-button rigenera secondary"
                    onClick={handleRigeneraLink}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Rigenerazione...' : 'Rigenera Link'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="invito-modal-info">
            <p>
              <strong>Nota:</strong> Solo tu, come amministratore della lega, puoi invitare giocatori.
              {!isLinkScaduto && codiceLega && !countdown && (
                <span className="invito-modal-validita"> Il link è valido per 12 ore dal momento dell'invito.</span>
              )}
            </p>
          </div>
        </div>
        <div className="invito-modal-footer">
          <button className="invito-modal-button chiudi" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitoModal; 