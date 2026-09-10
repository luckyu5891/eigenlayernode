/* =====================================================================
   CHURCH CONFIG  |  Edit this one file to personalise the whole site.
   Every page reads from window.CHURCH at load time.
   ===================================================================== */
window.CHURCH = {
  name: 'New Hope Community Church',
  shortName: 'New Hope',
  tagline: 'A place to belong, grow, and play',
  address: '123 Chapel Lane, Springfield',
  phone: '(555) 010-2024',
  email: 'hello@newhopechurch.example',
  // Used by the Welcome Center map embed. Any address or place name works.
  mapQuery: 'Springfield community church',
  serviceTimes: [
    { day: 'Sunday', time: '9:00 AM', label: 'Classic Service' },
    { day: 'Sunday', time: '11:00 AM', label: 'Family Service' },
    { day: 'Wednesday', time: '7:00 PM', label: 'Midweek Prayer' }
  ],
  about: 'We are a brand new church family with open doors and a big backyard. Whether you have been walking with God for decades or are just curious, there is a seat for you here. Explore the campus, play a few games, and come say hello in person.',
  // Where the Contact form sends mail (uses the visitor\'s email app).
  contactEmail: 'hello@newhopechurch.example'
};
