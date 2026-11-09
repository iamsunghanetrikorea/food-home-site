// 전화문자 상담: choose a course, tick subjects, fill contact details. '문자 보내기' builds the
// consultation message and opens the messaging app addressed to the academy with the message filled in.
// On a phone that is the SMS app. On a PC it is the desktop messaging app (Mac 메시지 / Windows 휴대폰 연결)
// when one is registered for sms: links; because a PC may have none, the page also copies the message and
// shows a QR code that opens the phone's SMS app with the same message. Nothing is stored or sent by the site.
(() => {
  const form = document.getElementById('kk-form');
  if (!form) return;
  const cats = [...form.querySelectorAll('.kk-cat')];
  const panels = [...form.querySelectorAll('.kk-panel')];
  const picked = document.getElementById('kk-picked');
  const status = document.getElementById('kk-status');
  const pc = document.getElementById('kk-pc');
  const pcLead = document.getElementById('kk-pc-lead');
  const pcStatus = document.getElementById('kk-pc-status');
  const qrBox = document.getElementById('kk-qr');
  const msgBox = document.getElementById('kk-msg');
  const copyBtn = document.getElementById('kk-copy');
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // Apple (iOS and Mac 메시지) reads the sms: body after "&", Android and Windows after "?".
  const apple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const SMS_TO = '0425266226';
  const SMS_TEL = '042-526-6226';
  const smsHref = (text) => `sms:${SMS_TO}${apple ? '&' : '?'}body=${encodeURIComponent(text)}`;
  // QR payload: the SMSTO form is what phone cameras (iOS and Android) open straight into the SMS app.
  const smsQr = (text) => `SMSTO:${SMS_TO}:${text}`;

  // Copy: the async clipboard first, then the selection fallback for older or locked-down browsers.
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      msgBox.focus(); msgBox.select(); msgBox.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    } catch (e) { return false; }
  };
  copyBtn.addEventListener('click', async () => {
    const ok = await copy(msgBox.value);
    pcStatus.textContent = ok ? '다시 복사했습니다. 메시지 앱에 붙여넣어 주세요.' : '복사하지 못했습니다. 메시지를 직접 선택해 복사해 주세요.';
    if (!ok) { msgBox.focus(); msgBox.select(); }
  });

  const drawQr = (text) => {
    qrBox.textContent = '';
    if (typeof QRCode !== 'function') { qrBox.textContent = 'QR 코드를 만들 수 없습니다.'; return; }
    try {
      new QRCode(qrBox, { text, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) {
      // the message is too long for one QR: fall back to a code without the body, the number still opens the app
      qrBox.textContent = '';
      new QRCode(qrBox, { text: `SMSTO:${SMS_TO}:`, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
    }
  };

  cats.forEach((btn) => btn.addEventListener('click', () => {
    cats.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    panels.forEach((p) => { p.hidden = p.id !== btn.getAttribute('aria-controls'); });
  }));

  const chosen = () => [...form.querySelectorAll('input[name="subject"]:checked')].map((i) => ({ course: i.dataset.course, subject: i.value }));
  const showPicked = () => {
    const list = chosen();
    picked.textContent = list.length ? list.map((s) => s.subject).join(', ') : '희망하시는 교육과정을 선택해 주세요.';
    picked.classList.toggle('has-items', list.length > 0);
  };
  form.addEventListener('change', (e) => { if (e.target.name === 'subject') showPicked(); });

  ['kk-tel2', 'kk-tel3'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 4); });
  });

  const fail = (el, text) => {
    status.textContent = text; status.classList.add('is-error');
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  };

  // Check the form and build the consultation message; returns null (after flagging the field) if incomplete.
  const buildMessage = (title) => {
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    status.classList.remove('is-error'); status.textContent = '';
    const list = chosen();
    const name = form.elements.fullname.value.trim();
    const t2 = form.tel2.value, t3 = form.tel3.value;
    if (!list.length) { fail(form.querySelector('.kk-cat[aria-pressed="true"]'), '상담받을 과목을 하나 이상 선택해 주세요.'); return null; }
    if (!name) { fail(form.elements.fullname, '이름을 입력해 주세요.'); return null; }
    if (t2.length < 3 || t3.length < 4) { fail(t2.length < 3 ? form.tel2 : form.tel3, '연락처를 끝까지 입력해 주세요.'); return null; }
    if (!form.agree.checked) { fail(form.agree, '상담 메시지 작성 동의에 체크해 주세요.'); return null; }

    const memo = form.memo.value.trim();
    return [
      `[이화푸드조리제빵학원 ${title}]`,
      `희망 과정: ${list.map((s) => `${s.subject} (${s.course})`).join(', ')}`,
      `이름: ${name}`,
      `연락처: ${form.tel1.value}-${t2}-${t3}`,
      memo ? `문의 내용: ${memo}` : null,
    ].filter(Boolean).join('\n');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = buildMessage('전화문자 상담 신청');
    if (!text) return;

    if (mobile) {
      status.textContent = '문자 앱이 열렸다면 내용을 확인하고 전송을 눌러 주세요.';
      window.location.href = smsHref(text);
      return;
    }

    // PC: hand the message to the desktop messaging app, and show the copy + QR fallbacks in case there is none.
    msgBox.value = text;
    drawQr(smsQr(text));
    pcStatus.textContent = '';
    pcLead.textContent = 'PC의 메시지 앱(Mac 메시지, Windows 휴대폰 연결)을 여는 중입니다. 앱이 열렸다면 전송만 누르시면 됩니다.';
    pc.hidden = false;
    const copied = await copy(text);
    status.textContent = copied ? '상담 메시지를 복사했습니다. 아래 안내를 확인해 주세요.' : '아래 안내를 확인해 주세요.';
    pc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    pc.focus({ preventScroll: true });

    let handed = false;
    const onHide = () => { if (document.hidden) handed = true; };
    document.addEventListener('visibilitychange', onHide);
    window.location.href = smsHref(text);
    window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      if (handed) return;
      pcLead.textContent = `PC에 메시지 앱이 없으면 휴대폰으로 아래 QR을 찍어 바로 보내시거나, 복사된 메시지를 붙여넣어 ${SMS_TEL}으로 보내 주세요.`;
    }, 2500);
  });
})();
