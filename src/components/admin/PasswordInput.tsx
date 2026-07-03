'use client';

import { useState } from 'react';

interface Props {
  name: string;
  label: string;
  required?: boolean;
  minLength?: number;
}

export default function PasswordInput({ name, label, required, minLength }: Props) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={visivel ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-rotary-blue focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          tabIndex={-1}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-rotary-blue"
        >
          {visivel ? (
            // olho riscado (ocultar)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          ) : (
            // olho aberto (mostrar)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
