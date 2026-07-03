import { definirSenha } from './actions';
import PasswordInput from '@/components/admin/PasswordInput';

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-rotary-blueDark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="font-display text-xl text-rotary-blueDark">Bem-vindo(a) à equipe!</h1>
        <p className="mt-1 text-sm text-slate-500">
          Defina sua senha de acesso ao painel administrativo da rifa.
        </p>

        {erro && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            A senha precisa ter pelo menos 8 caracteres.
          </div>
        )}

        <form action={definirSenha} className="mt-5 space-y-3">
          <PasswordInput name="password" label="Nova senha" minLength={8} required />
          <button
            type="submit"
            className="w-full rounded-lg bg-rotary-gold py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-500"
          >
            Salvar senha e entrar
          </button>
        </form>
      </div>
    </main>
  );
}
