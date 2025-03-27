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

  // Formatta l'ora di scadenza (aggiornata)
  const formattaOraScadenza = () => {
    if (!ultimoInvito) return null;
    
    const dataUltimoInvito = new Date(ultimoInvito);
    const dataScadenza = new Date(dataUltimoInvito.getTime() + 12 * 60 * 60 * 1000); // 12 ore in millisecondi
    
    // Formatta in ore:minuti
    const ore = dataScadenza.getHours().toString().padStart(2, '0');
    const minuti = dataScadenza.getMinutes().toString().padStart(2, '0');
    
    // Formato: "15:30" ecc.
    return `${ore}:${minuti}`;
  };
  
  // Condividi su WhatsApp
  const handleCondividiWhatsApp = () => {
    const oraScadenza = formattaOraScadenza();
    const testoMessaggio = encodeURIComponent(
      `Entra a far parte della lega ${nomeLega} su Totohockey! \n` +
      `Usa questo link per accedere, è valido fino alle ${oraScadenza || 'prossime 12 ore'} \n\n` +
      `${linkInvito}`
    );
    
    window.open(`https://wa.me/?text=${testoMessaggio}`, '_blank');
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
                <div className="invito-modal-actions">
                  <button 
                    className="invito-modal-button copia"
                    onClick={handleCopiaLink}
                  >
                    {linkCopiato ? 'Copiato!' : 'Copia'}
                  </button>
                  <button 
                    className="invito-modal-button whatsapp"
                    onClick={handleCondividiWhatsApp}
                    title="Condividi su WhatsApp"
                  >
                    <svg className="whatsapp-icon" viewBox="0 0 448 512" width="16" height="16">
                      <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
                    </svg>
                    WhatsApp
                  </button>
                </div>
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