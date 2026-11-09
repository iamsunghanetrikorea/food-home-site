// 전화문자 상담: choose a course, tick subjects, fill contact details. '문자 보내기' builds the
// consultation message and opens the phone's messaging app addressed to the academy with the message
// filled in. Nothing is stored or sent by the site itself.
(() => {
  const form = document.getElementById('kk-form');
  if (!form) return;
  const cats = [...form.querySelectorAll('.kk-cat')];
  const panels = [...form.querySelectorAll('.kk-panel')];
  const picked = document.getElementById('kk-picked');
  const status = document.getElementById('kk-status');
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // iOS reads the sms: body after "&", Android and others after "?".
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const SMS_TO = '0425266226';
  const smsHref = (text) => `sms:${SMS_TO}${ios ? '&' : '?'}body=${encodeURIComponent(text)}`;

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = buildMessage('전화문자 상담 신청');
    if (!text) return;
    if (mobile) {
      status.textContent = '문자 앱이 열렸다면 내용을 확인하고 전송을 눌러 주세요.';
      window.location.href = smsHref(text);
    } else {
      status.textContent = '문자 발송은 휴대폰에서 이용해 주세요. PC에서는 042-526-6226으로 전화 주시면 상담해 드립니다.';
      window.location.href = smsHref(text);
    }
  });
})();
