import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        backgroundColor: '#181822',
        border: `1px solid ${isError ? 'rgba(241, 94, 94, 0.4)' : 'rgba(29, 185, 84, 0.4)'}`,
        borderRadius: '9999px',
        boxShadow: isError ? '0 8px 24px rgba(241, 94, 94, 0.25)' : '0 8px 24px rgba(29, 185, 84, 0.25)',
        color: '#ffffff',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.9rem',
        fontWeight: '600'
      }}
      className="animate-fade-in"
    >
      {isError ? (
        <AlertCircle size={20} color="#f15e5e" />
      ) : (
        <CheckCircle2 size={20} color="#1DB954" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
