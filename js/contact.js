document.querySelector('#contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const details = new FormData(form);
  const name = String(details.get('name') || '').trim();
  const email = String(details.get('email') || '').trim();
  const phone = String(details.get('phone') || '').trim();
  const topic = String(details.get('topic') || '').trim();
  const message = String(details.get('message') || '').trim();
  const subject = `Hotel President enquiry: ${topic}`;
  const body = `Hello Hotel President,\n\n${message}\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nEnquiry: ${topic}`;
  window.location.href = `mailto:hotelpresidentagra@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
