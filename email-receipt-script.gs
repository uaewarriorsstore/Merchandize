/**
 * Retail POS – emails the customer's PDF receipt.
 * Deploy: Extensions ▸ Apps Script ▸ paste this ▸ Deploy ▸ New deployment ▸ Web app
 *         Execute as: Me   ·   Who has access: Anyone   ▸ Deploy ▸ copy the /exec link.
 * Paste that link in POS ⚙ Settings (box 9) – or into EMBED.mail in pos.html.
 */
var KEY = '';                       // optional secret – must equal "Email service key" in POS Settings
var SENDER_NAME = 'UAE Warriors Merchandize – Palms Sports';
var REPLY_TO = '';                  // optional, e.g. 'sales@yourdomain.com'

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (KEY && d.key !== KEY) return out_('forbidden');
    var to = String(d.to || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return out_('bad email');
    if (!d.pdf) return out_('no pdf');

    var cur = d.currency || 'AED';
    var money = function (n) { return Number(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    var when = Utilities.formatDate(new Date(d.time), Session.getScriptTimeZone(), 'dd MMM yyyy, HH:mm');

    var rows = (d.items || []).map(function (i) {
      return '<tr><td style="padding:8px 0;border-bottom:1px solid #eee">' + esc(i.name || i.code) +
        (i.size ? ' · ' + esc(i.size) : '') + '<br><span style="color:#888;font-size:12px">' + esc(i.code) + ' × ' + esc(i.qty) + '</span></td>' +
        '<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">' +
        (Number(i.final) === 0 ? 'FREE' : cur + ' ' + money(i.final)) + '</td></tr>';
    }).join('');

    var html =
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#111">' +
      '<h2 style="margin:0 0 4px">Thank you for shopping with us!</h2>' +
      '<p style="margin:0 0 16px;color:#555">UAE Warriors Merchandize · by Palms Sports</p>' +
      '<p style="margin:0 0 4px"><b>Bill No:</b> ' + esc(d.billNo) + '<br><b>Date:</b> ' + esc(when) +
      '<br><b>Payment:</b> ' + esc(d.mode) + (d.event ? '<br><b>Event:</b> ' + esc(d.event) : '') + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:12px">' + rows +
      '<tr><td style="padding-top:12px;font-weight:bold;font-size:16px">Total</td>' +
      '<td style="padding-top:12px;text-align:right;font-weight:bold;font-size:16px">' + cur + ' ' + money(d.total) + '</td></tr></table>' +
      '<p style="margin-top:20px;color:#555">Your receipt is attached as a PDF.' +
      (d.receiptUrl ? ' You can also <a href="' + esc(d.receiptUrl) + '">view it online</a>.' : '') + '</p>' +
      '<p style="color:#999;font-size:12px">This is an automated message.</p></div>';

    var pdf = Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', d.filename || ('Receipt-' + d.billNo + '.pdf'));
    var opts = {to: to, subject: 'Your receipt – UAE Warriors Merchandize (Bill ' + d.billNo + ')',
                htmlBody: html, body: 'Thank you for shopping with us! Your receipt for bill ' + d.billNo + ' is attached.',
                name: SENDER_NAME, attachments: [pdf]};
    if (REPLY_TO) opts.replyTo = REPLY_TO;
    MailApp.sendEmail(opts);
    return out_('ok');
  } catch (err) {
    return out_('error: ' + err);
  }
}

function doGet() { return out_('Email receipt service is running'); }
function out_(t) { return ContentService.createTextOutput(t); }
