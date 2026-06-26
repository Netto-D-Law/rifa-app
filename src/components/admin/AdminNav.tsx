import Link from 'next/link';
import { logout } from '@/app/admin/login/actions';

export default function AdminNav({ nomeAdmin }: { nomeAdmin: string }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display text-sm font-bold text-rotary-blueDark">
            Painel da Rifa
          </span>
          <nav className="flex gap-4 text-sm text-slate-500">
            <Link href="/admin" className="hover:text-rotary-blue">
              Pedidos
            </Link>
            <Link href="/admin/configuracoes" className="hover:text-rotary-blue">
              Configurações
            </Link>
            <Link href="/admin/equipe" className="hover:text-rotary-blue">
              Equipe &amp; log
            </Link>
            <Link href="/admin/sorteio" className="hover:text-rotary-blue">
              Sorteio
            </Link>
            <Link href="/" className="hover:text-rotary-blue">
              Ver site público ↗
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{nomeAdmin}</span>
          <form action={logout}>
            <button className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
