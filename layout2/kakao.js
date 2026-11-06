// 카카오톡 상담: choose a course, tick subjects, fill contact details. On submit the page writes a
// consultation message, copies it, and opens a dialog that walks the visitor through pasting it into
// the academy's Kakao channel chat. Nothing is stored or sent by the site.
(() => {
  const form = document.getElementById('kk-form');
  if (!form) return;
  const cats = [...form.querySelectorAll('.kk-cat')];
  const panels = [...form.querySelectorAll('.kk-panel')];
  const picked = document.getElementById('kk-picked');
  const status = document.getElementById('kk-status');
  const dlg = document.getElementById('kk-dlg');
  const msgBox = document.getElementById('kk-msg');
  const dlgHead = document.getElementById('kk-dlg-h');
  const dlgLead = document.getElementById('kk-dlg-lead');
  const dlgStatus = document.getElementById('kk-dlg-status');
  const openBtn = document.getElementById('kk-open');
  const recopy = document.getElementById('kk-recopy');
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) { openBtn.removeAttribute('target'); }  // on a phone the link hands over to the Kakao app

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

  // Copy: the async clipboard first, then the selection fallback for older or locked-down browsers.
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      msgBox.focus(); msgBox.select(); msgBox.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    } catch (e) { return false; }
  };

  const showResult = (ok) => {
    dlgHead.textContent = ok ? '상담 메시지를 복사했습니다' : '상담 메시지를 복사해 주세요';
    dlgLead.textContent = ok
      ? '카카오톡 채팅창에 붙여넣고 보내기만 하면 상담 신청이 끝납니다.'
      : '이 브라우저는 자동 복사를 막고 있습니다. 아래 메시지를 길게 눌러(또는 Ctrl+C) 복사한 뒤 카카오톡에 붙여넣어 주세요.';
    if (!ok) { msgBox.focus(); msgBox.select(); }
  };

  const openDialog = () => {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('kk-locked');
    (dlg.querySelector('#kk-open')).focus();
  };
  const closeDialog = () => {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  };
  dlg.addEventListener('close', () => { document.body.classList.remove('kk-locked'); form.querySelector('.kk-submit').focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDialog(); });
  document.getElementById('kk-close').addEventListener('click', closeDialog);

  recopy.addEventListener('click', async () => {
    const ok = await copy(msgBox.value);
    dlgStatus.textContent = ok ? '다시 복사했습니다. 카카오톡에 붙여넣어 주세요.' : '복사하지 못했습니다. 메시지를 직접 선택해 복사해 주세요.';
    if (!ok) { msgBox.focus(); msgBox.select(); }
  });
  openBtn.addEventListener('click', () => {
    dlgStatus.textContent = '카카오톡 채팅창이 열렸다면 입력창에 붙여넣고 전송을 눌러 주세요.';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    status.classList.remove('is-error'); status.textContent = '';
    const list = chosen();
    const name = form.elements.fullname.value.trim();
    const t2 = form.tel2.value, t3 = form.tel3.value;
    if (!list.length) return fail(form.querySelector('.kk-cat[aria-pressed="true"]'), '상담받을 과목을 하나 이상 선택해 주세요.');
    if (!name) return fail(form.elements.fullname, '이름을 입력해 주세요.');
    if (t2.length < 3 || t3.length < 4) return fail(t2.length < 3 ? form.tel2 : form.tel3, '연락처를 끝까지 입력해 주세요.');
    if (!form.agree.checked) return fail(form.agree, '상담 메시지 작성 동의에 체크해 주세요.');

    const memo = form.memo.value.trim();
    const text = [
      '[이화푸드조리제빵학원 카카오톡 상담 신청]',
      `희망 과정: ${list.map((s) => `${s.subject} (${s.course})`).join(', ')}`,
      `이름: ${name}`,
      `연락처: ${form.tel1.value}-${t2}-${t3}`,
      memo ? `문의 내용: ${memo}` : null,
    ].filter(Boolean).join('\n');

    msgBox.value = text;
    dlgStatus.textContent = '';
    const ok = await copy(text);
    openDialog();
    showResult(ok);
  });
})();
