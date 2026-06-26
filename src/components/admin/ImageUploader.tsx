'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  valorInicial: string;
  onUpload: (novaUrl: string) => Promise<{ ok: boolean; erro?: string }>;
}

export default function ImageUploader({ valorInicial, onUpload }: Props) {
  const [url, setUrl] = useState(valorInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5MB.');
      return;
    }

    setEnviando(true);
    setErro('');
    setSalvo(false);

    const supabase = createClient();
    const extensao = file.name.split('.').pop();
    const caminho = `premio-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from('premios')
      .upload(caminho, file, { cacheControl: '3600', upsert: false });

    if (erroUpload) {
      setErro('Falha no upload: ' + erroUpload.message);
      setEnviando(false);
      return;
    }

    const { data } = supabase.storage.from('premios').getPublicUrl(caminho);
    const resp = await onUpload(data.publicUrl);

    if (!resp.ok) {
      setErro('Imagem enviada, mas falhou ao salvar: ' + resp.erro);
      setEnviando(false);
      return;
    }

    setUrl(data.publicUrl);
    setSalvo(true);
    setEnviando(false);
  }

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Prêmio" className="h-20 w-20 rounded-lg object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-2xl">
          🎟️
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          {enviando ? 'Enviando…' : 'Trocar foto'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
        {salvo && <p className="mt-1 text-xs text-rotary-green">Foto atualizada!</p>}
      </div>
    </div>
  );
}
