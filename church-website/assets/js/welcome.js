/* WELCOME CENTER | service times, map embed, contact form, visit stamp */
(function () {
  'use strict';
  const { $, el, Passport, Toast, Sfx } = window.App;
  const C = window.CHURCH;

  document.addEventListener('DOMContentLoaded', () => {
    C.serviceTimes.forEach(s => $('#service-times').append(el('li', { html: `<strong>${s.day} ${s.time}</strong> · ${s.label}` })));
    $('#email-link').href = 'mailto:' + C.email;
    const q = encodeURIComponent(C.mapQuery || C.address);
    $('#map-embed').src = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
    $('#directions').href = `https://www.google.com/maps/search/?api=1&query=${q}`;
    $('#ready-btn').addEventListener('click', () => { Sfx.play('good'); Toast.show('We cannot wait to meet you.'); Passport.stamp('welcome', 'Planning a visit'); });
    $('#contact-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#cf-name').value.trim(), email = $('#cf-email').value.trim(), msg = $('#cf-msg').value.trim();
      const body = encodeURIComponent(`${msg}\n\nFrom: ${name} (${email})`);
      location.href = `mailto:${C.contactEmail}?subject=${encodeURIComponent('Hello from the website')}&body=${body}`;
      Passport.stamp('welcome', 'Sent a message');
    });
  });
})();
