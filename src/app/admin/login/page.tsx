import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-rotary-blueDark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="font-display text-xl text-rotary-blueDark">Acesso administrador</h1>
        <p className="mt-1 text-sm text-slate-500">Rifa Solidária — Rotary Club Butantã</p>

        {erro && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro === 'link_invalido_ou_expirado'
              ? 'O link de convite é inválido ou expirou. Peça um novo convite.'
              : 'E-mail ou senha incorretos.'}
          </div>
        )}

        <form action={login} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Senha</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-rotary-blue py-2.5 text-sm font-bold text-white hover:bg-rotary-blueDark"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
