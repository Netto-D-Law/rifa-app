// Gerador do payload Pix "Copia e Cola" (BR Code), formato EMV QR Code.
// Especificação pública do Banco Central — qualquer chave Pix válida funciona
// com qualquer banco/carteira que leia QR code Pix.

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function sanitizeAscii(text: string, maxLen: number): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim();
  return normalized.slice(0, maxLen) || 'NA';
}

// CRC16/CCITT-FALSE — algoritmo exigido pelo padrão EMV QR Code para o
// campo de checksum final (ID "63").
function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  txid?: string;
}

export function gerarPixPayload({
  chave,
  nomeRecebedor,
  cidade,
  valor,
  txid,
}: PixPayloadParams): string {
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave.trim());

  const txidLimpo = sanitizeAscii(txid || '***', 25);
  const additionalData = tlv('05', txidLimpo);

  let payload =
    tlv('00', '01') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', valor.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', sanitizeAscii(nomeRecebedor, 25)) +
    tlv('60', sanitizeAscii(cidade, 15)) +
    tlv('62', additionalData);

  payload += '6304'; // ID + tamanho do campo CRC, antes de calcular o CRC
  const crc = crc16(payload);
  return payload + crc;
}
