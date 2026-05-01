import { amountToWordsAz } from './numToWordsAz'

// Reflect Architects company details — matches the PDF template header exactly
const COMPANY = {
  name: 'REFLECT',
  subtitle: 'ARCHITECTS',
  voen: '1201978521',
  hh: 'AZ83AIIB400600F9441720614105',
  bank: '"Kapital Bank" ASC Səbail filial',
  bankVoen: '9900003611',
  mh: 'AZ37NABZ01350100000000001944',
  kod: '200059',
  swift: 'AIIBAZ2XXXX',
  director: 'Nusalov Nicat',
  directorTitle: '"Reflect Architects" MMC-in Direktoru',
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

export function buildInvoiceHTML(invoice, client, project) {
  const items = Array.isArray(invoice.line_items) && invoice.line_items.length
    ? invoice.line_items
    : [{ name: '', unit: 'ədəd', qty: 1, price: 0 }]

  // Pad to at least 4 rows to match the printed template aesthetic
  const padded = [...items]
  while (padded.length < 4) padded.push({ name: '', unit: 'ədəd', qty: 1, price: 0 })

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const vatRate = Number(invoice.vat_rate ?? 18)
  const vatAmt = invoice.payment_method === 'cash' ? 0 : Math.round(subtotal * vatRate) / 100
  const grand = subtotal + vatAmt
  const advance = Number(invoice.advance_paid) || 0
  const due = Math.max(0, grand - advance)
  const inWords = amountToWordsAz(due)

  const rows = padded.map((it, i) => {
    const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0)
    const isFilled = it.name || lineTotal > 0
    return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="content">${esc(it.name || '')}</td>
        <td class="ctr">${esc(it.unit || (isFilled ? 'ədəd' : ''))}</td>
        <td class="ctr">${isFilled ? esc(it.qty ?? 1) : ''}</td>
        <td class="ctr">${isFilled ? `AZN ${fmtNum(it.price)}` : 'AZN -'}</td>
        <td class="ctr">${isFilled ? `AZN ${fmtNum(lineTotal)}` : 'AZN -'}</td>
      </tr>`
  }).join('')

  return `<!doctype html>
<html lang="az"><head><meta charset="utf-8">
<title>Hesab-Faktura ${esc(invoice.invoice_number || invoice.name || '')}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 11pt; margin: 0; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .logo { letter-spacing: 4px; font-weight: bold; font-size: 14pt; border: 1.5px solid #000; padding: 4px 14px; display: inline-block; }
  .logo .sub { display: block; font-size: 7pt; letter-spacing: 3px; text-align: center; font-weight: normal; margin-top: 2px; }
  .date-block { text-align: right; padding-top: 8px; }
  .date-block strong { font-weight: bold; }
  .info { font-size: 10pt; line-height: 1.5; margin-bottom: 6px; }
  .info b { font-weight: bold; }
  .invoice-no { text-align: center; margin: 18px 0 10px; }
  .invoice-no .label { font-weight: bold; }
  .alici { margin-top: 14px; font-size: 10pt; }
  .alici b { font-weight: bold; }
  .muqavile { text-align: center; margin: 18px 0 14px; font-weight: bold; font-size: 11pt; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 6px; }
  table.items th, table.items td { border: 1px solid #000; padding: 8px 6px; vertical-align: middle; }
  table.items th { font-weight: bold; text-align: center; background: #fff; }
  table.items td.num { text-align: center; font-weight: bold; width: 36px; }
  table.items td.content { min-height: 36px; height: 40px; }
  table.items td.ctr { text-align: center; }
  .totals { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .totals td { border: 1px solid #000; padding: 6px 8px; }
  .totals td.label { text-align: right; font-weight: bold; }
  .totals td.val { text-align: center; width: 110px; }
  .words { border: 1px solid #000; border-top: none; padding: 8px; font-size: 10pt; font-weight: bold; }
  .footer { margin-top: 60px; text-align: center; font-size: 10pt; }
  .footer .name { font-weight: bold; }
  .footer .line { margin-top: 6px; border-top: 1px solid #000; width: 240px; margin-left: auto; margin-right: auto; }
  @media print { .no-print { display: none !important; } }
  .no-print { position: fixed; top: 12px; right: 12px; background: #0f172a; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; border: none; font-size: 12pt; z-index: 999; }
</style>
</head><body>
<button class="no-print" onclick="window.print()">🖨 Çap et / PDF saxla</button>

<div class="top">
  <div>
    <div class="logo">${COMPANY.name}<span class="sub">${COMPANY.subtitle}</span></div>
  </div>
  <div class="date-block">
    <strong>Tarix:</strong> ${esc(fmtDate(invoice.invoice_date))}
  </div>
</div>

<div class="info">
  <b>VÖEN:</b> ${COMPANY.voen}<br>
  <b>H/H :</b> ${COMPANY.hh}<br>
  <b>${COMPANY.bank}</b><br>
  <b>Vöen Bank:</b> ${COMPANY.bankVoen}<br>
  <b>M/H:</b> ${COMPANY.mh}<br>
  <b>Kod:</b> &nbsp; ${COMPANY.kod}<br>
  <b>SWIFT:</b> &nbsp; ${COMPANY.swift}
</div>

<div class="invoice-no">
  <span class="label">Hesab Faktura nömrəsi:</span> <strong>${esc(invoice.invoice_number || invoice.name || '')}</strong>
</div>

<div class="alici">
  <b>Alıcı:</b> ${esc(client?.name || '—')}<br>
  <b>VÖEN:</b> ${esc(invoice.client_voen || '')}
</div>

<div class="muqavile">${esc(invoice.contract_name || project?.name || '')}</div>

<table class="items">
  <thead>
    <tr>
      <th>№</th>
      <th>Məzmun</th>
      <th>Ölçü vahidi</th>
      <th>Miqdar</th>
      <th>Qiymət</th>
      <th>Cəmi Məbləğ</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<table class="totals">
  <tr><td class="label" colspan="5">Ümumi məbləğ</td><td class="val"><b>${fmtNum(subtotal)}</b></td></tr>
  <tr><td class="label" colspan="5">ƏDV (${vatRate}%)</td><td class="val">${fmtNum(vatAmt)}</td></tr>
  <tr><td class="label" colspan="5">Yekun məbləğ</td><td class="val">${fmtNum(grand)}</td></tr>
  <tr><td class="label" colspan="5">Ödənilmiş avans</td><td class="val">${fmtNum(advance)}</td></tr>
  <tr><td class="label" colspan="5"><b>Ödənilməli Yekun məbləğ</b></td><td class="val"><b>${fmtNum(due)}</b></td></tr>
</table>
<div class="words"><b>Məbləğ söz ilə:</b> ${esc(inWords)}</div>

<div class="footer">
  <div class="name">${COMPANY.director}</div>
  <div>${COMPANY.directorTitle}</div>
  <div class="line"></div>
</div>

<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350))</script>
</body></html>`
}

export function printInvoice(invoice, client, project) {
  const html = buildInvoiceHTML(invoice, client, project)
  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) {
    alert('Pop-up bloklanıb. Brauzerdə bu sayta pop-up icazəsi verin.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
