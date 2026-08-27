import React from 'react';
import { MdClose } from 'react-icons/md';

export default function Modal({ open, onClose, title, subtitle, icon, iconBg, iconColor, size, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${size === 'lg' ? ' modal-lg' : ''}`}>
        <div className="modal-header">
          <div className="modal-header-left">
            {icon && (
              <div className="modal-header-icon" style={{ background: iconBg || '#dbeafe', color: iconColor || '#2563eb' }}>
                {icon}
              </div>
            )}
            <div>
              <h3>{title}</h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
