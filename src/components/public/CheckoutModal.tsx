'use client';

import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import type { Raffle, MetodoPagamento, ReservaResultado } from '@/lib/types';
import { formatMoeda, padNumero } from '@/lib/format';
import { gerarPixPayload } from '@/lib/pix';
import { reservarNumerosAction, reservarAleatoriosAction } from '@/app/actions';

interface Props {
  raffle: Raffle;
  numerosManuais: number[]; // vazio se for modo quantidade
  quantidade: number;
  onClose: () => void;
  onSucesso: () => void;
}

export default function CheckoutModal({
  raffle,
  numerosManuais,
  quantidade,
  onClose,
  onSucesso,
}: Props) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [titularNome, setTitularNome] = useState('');
  const [titularContato, setTitularContato] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ReservaResultado | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [pixPayload, setPixPayload] = useState('');
  const [copiado, setCopiado] = useState(false);

  const usandoManual = numerosManuais.length > 0;
  const qtdEfetiva = usandoManual ? numerosManuais.length : quantidade;
  const totalEstimado = qtdEfetiva * raffle.preco_por_numero;

  useEffect(() => {
    if (!resultado || metodo !== 'pix') return;
    const payload = gerarPixPayload({
      chave: raffle.pix_chave,
      nomeRecebedor: raffle.pix_nome_recebedor || 'ROTARY CLUB BUTANTA',
      cidade: raffle.pix_cidade || 'SAO PAULO',
      valor: resultado.valor_total,
      txid: resultado.pedido_id.replace(/-/g, '').slice(0, 25),
    });
    setPixPayload(payload);
    QRCode.toDataURL(payload, { width: 260, margin: 1 }).then(setQrDataUrl);
  }, [resultado, metodo, raffle]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (nome.trim().length < 2) {
      setErro('Informe seu nome completo.');
      return;
    }
    if (whatsapp.trim().length < 8) {
      setErro('Informe um WhatsApp válido.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (!metodo) {
      setErro('Escolha uma forma de pagamento.');
      return;
    }
    if (metodo === 'cartao') {
      if (titularNome.trim().length < 2) {
        setErro('Informe o nome do titular do cartão.');
        return;
      }
      if (titularContato.trim().length < 8) {
        setErro('Informe um contato válido do titular do cartão.');
        return;
      }
    }

    setCarregando(true);
    // Quando o pagamento é no cartão (presencial), guardamos o nome/contato do
    // titular junto do nome do comprador, já que ainda não temos colunas
    // próprias para isso no banco.
    const nomeFinal =
      metodo === 'cartao' && titularNome.trim()
        ? `${nome.trim()} (titular do cartão: ${titularNome.trim()} - ${titularContato.trim()})`
        : nome.trim();
    const dados = { nome: nomeFinal, whatsapp: whatsapp.trim(), email: email.trim(), metodo };

    const resp = usandoManual
      ? await reservarNumerosAction(raffle.id, numerosManuais, dados)
      : await reservarAleatoriosAction(raffle.id, quantidade, dados);

    setCarregando(false);

    if (!resp.ok) {
      setErro(resp.erro);
      return;
    }

    setResultado(resp.resultado);
    onSucesso();
  }

  function copiarPix() {
    navigator.clipboard.writeText(pixPayload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xl text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>

        {!resultado ? (
          <>
            <h3 className="font-display text-lg text-rotary-blueDark">
              {usandoManual
                ? `Reservar ${numerosManuais.length} número(s)`
                : `Reservar ${quantidade} número(s) aleatório(s)`}
            </h3>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              Total estimado: <strong>{formatMoeda(totalEstimado)}</strong>. O número fica
              reservado para você até a confirmação do pagamento.
            </p>

            {erro && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Nome completo
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  WhatsApp
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 90000-0000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  E-mail
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Forma de pagamento
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodo('pix')}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold ${
                      metodo === 'pix'
                        ? 'border-rotary-blue bg-rotary-bluePale text-rotary-blue'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('cartao')}
                    className={`flex-1 rounded-lg border-2 py-2 text-xs font-semibold leading-tight ${
                      metodo === 'cartao'
                        ? 'border-rotary-blue bg-rotary-bluePale text-rotary-blue'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    Cartão na maquininha
                    <br />
                    (apenas em eventos)
                  </button>
                </div>
              </div>

              {metodo === 'cartao' && (
                <div className="space-y-3 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    O pagamento com cartão só é possível presencialmente, em eventos do Rotary
                    Club Butantã. Informe abaixo o nome e contato de quem vai pagar no cartão.
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Nome do titular do cartão
                    </label>
                    <input
                      value={titularNome}
                      onChange={(e) => setTitularNome(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Contato do titular do cartão
                    </label>
                    <input
                      value={titularContato}
                      onChange={(e) => setTitularContato(e.target.value)}
                      placeholder="(11) 90000-0000"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full rounded-lg bg-rotary-blue py-2.5 text-sm font-bold text-white hover:bg-rotary-blueDark disabled:opacity-50"
              >
                {carregando ? 'Reservando…' : 'Reservar agora'}
              </button>
            </form>
          </>
        ) : (
          <div>
            <h3 className="font-display text-lg text-rotary-blueDark">Número(s) reservado(s)! 🎟️</h3>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              Números: <strong>{resultado.numeros.map((n) => padNumero(n, raffle.total_numeros)).join(', ')}</strong>
              <br />
              Valor total: <strong>{formatMoeda(resultado.valor_total)}</strong>
            </p>

            {metodo === 'pix' ? (
              <div className="space-y-3">
                {raffle.pix_chave ? (
                  <>
                    <div className="flex justify-center">
                      {qrDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrDataUrl} alt="QR Code Pix" className="rounded-lg border" />
                      )}
                    </div>
                    <button
                      onClick={copiarPix}
                      className="w-full rounded-lg border border-rotary-blue py-2 text-sm font-semibold text-rotary-blue hover:bg-rotary-bluePale"
                    >
                      {copiado ? 'Copiado!' : 'Copiar código Pix'}
                    </button>
                    {raffle.pix_instrucoes && (
                      <p className="text-xs text-slate-500">{raffle.pix_instrucoes}</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    A chave Pix ainda não foi configurada pelo administrador. Aguarde contato pelo
                    WhatsApp informado.
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Após o pagamento, um administrador confirmará manualmente o recebimento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-rotary-bluePale px-3 py-2.5 text-sm text-rotary-blueDark">
                  Seus números ficam reservados até o pagamento presencial na maquininha, em um
                  evento do Rotary Club Butantã. Um administrador confirmará a venda após o
                  pagamento.
                </div>
                <p className="text-xs text-slate-400">
                  Titular do cartão: <strong>{titularNome}</strong> · {titularContato}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
