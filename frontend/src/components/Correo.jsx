import React, { useState, useEffect } from 'react';
import './Correo.css';

const Correo = () => {
  // Cargar datos del localStorage al iniciar
  const loadEmailData = () => {
    const saved = localStorage.getItem('emailDraft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          para: '',
          cc: '',
          cco: '',
          asunto: '',
          cuerpo: ''
        };
      }
    }
    return {
      para: '',
      cc: '',
      cco: '',
      asunto: '',
      cuerpo: ''
    };
  };

  const [emailData, setEmailData] = useState(loadEmailData);
  const [copiedField, setCopiedField] = useState(null);

  // Guardar en localStorage cada vez que cambie emailData
  useEffect(() => {
    localStorage.setItem('emailDraft', JSON.stringify(emailData));
  }, [emailData]);

  const handleChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('Error al copiar al portapapeles. Intenta seleccionar y copiar manualmente.');
    }
  };

  const clearEmail = () => {
    const emptyData = {
      para: '',
      cc: '',
      cco: '',
      asunto: '',
      cuerpo: ''
    };
    setEmailData(emptyData);
    localStorage.setItem('emailDraft', JSON.stringify(emptyData));
  };

  const CopyButton = ({ text, fieldName, label }) => {
    const handleCopy = () => {
      if (text) {
        copyToClipboard(text, fieldName);
      } else {
        // Si no hay texto, copiar el label del campo
        copyToClipboard('', fieldName);
      }
    };

    return (
      <button
        onClick={handleCopy}
        className="copy-btn"
        title={`Copiar ${label}`}
      >
        {copiedField === fieldName ? '✓' : '📋'}
      </button>
    );
  };

  return (
    <div className="correo-container">
      <div className="correo-header">
        <h1>📧 Redactar Correo</h1>
        <div className="header-actions">
          <button onClick={clearEmail} className="btn-clear">
            🗑️ Limpiar
          </button>
        </div>
      </div>

      <div className="correo-box">
        {/* Campo Para */}
        <div className="email-field email-field-inline">
          <label htmlFor="para" className="inline-label">
            <span className="field-label">Para:</span>
            <span className="field-required">*</span>
          </label>
          <div className="input-with-button">
            <input
              type="text"
              id="para"
              value={emailData.para}
              onChange={(e) => handleChange('para', e.target.value)}
              placeholder=""
              className="email-input"
            />
            <CopyButton text={emailData.para} fieldName="para" label="Para" />
          </div>
        </div>

        {/* Campo CC */}
        <div className="email-field email-field-inline">
          <label htmlFor="cc" className="inline-label">
            <span className="field-label">CC:</span>
          </label>
          <div className="input-with-button">
            <input
              type="text"
              id="cc"
              value={emailData.cc}
              onChange={(e) => handleChange('cc', e.target.value)}
              placeholder=""
              className="email-input"
            />
            <CopyButton text={emailData.cc} fieldName="cc" label="CC" />
          </div>
        </div>

        {/* Campo Asunto */}
        <div className="email-field email-field-inline">
          <label htmlFor="asunto" className="inline-label">
            <span className="field-label">Asunto:</span>
            <span className="field-required">*</span>
          </label>
          <div className="input-with-button">
            <input
              type="text"
              id="asunto"
              value={emailData.asunto}
              onChange={(e) => handleChange('asunto', e.target.value)}
              placeholder="Asunto"
              className="email-input"
            />
            <CopyButton text={emailData.asunto} fieldName="asunto" label="Asunto" />
          </div>
        </div>

        {/* Campo Cuerpo */}
        <div className="email-field email-field-body">
          <label htmlFor="cuerpo">
            <span className="field-label">Mensaje:</span>
            <span className="field-required">*</span>
          </label>
          <div className="textarea-with-button">
            <textarea
              id="cuerpo"
              value={emailData.cuerpo}
              onChange={(e) => handleChange('cuerpo', e.target.value)}
              placeholder="Escriba el mensaje"
              className="email-textarea"
              rows="6"
            />
            <CopyButton text={emailData.cuerpo} fieldName="cuerpo" label="Mensaje" />
          </div>
        </div>

        {/* Vista Previa */}
        {(emailData.para || emailData.asunto || emailData.cuerpo) && (
          <div className="email-preview">
            <h3>📄 Vista Previa del Correo</h3>
            <div className="preview-content">
              <div className="preview-line">
                <strong>Para:</strong> {emailData.para || <span className="empty">(vacío)</span>}
              </div>
              {emailData.cc && (
                <div className="preview-line">
                  <strong>CC:</strong> {emailData.cc}
                </div>
              )}
              {emailData.cco && (
                <div className="preview-line">
                  <strong>CCO:</strong> {emailData.cco}
                </div>
              )}
              <div className="preview-line">
                <strong>Asunto:</strong> {emailData.asunto || <span className="empty">(vacío)</span>}
              </div>
              <div className="preview-body">
                {emailData.cuerpo || <span className="empty">(sin mensaje)</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Correo;

