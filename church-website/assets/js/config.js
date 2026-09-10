/* =====================================================================
   CHURCH CONFIG  |  Edit this one file to personalise the site.
   Anything marked PLACEHOLDER should be replaced before launch.
   See CONTENT-CHECKLIST.md for the full list.
   ===================================================================== */
window.CHURCH = {
  name: 'St. Alphonsa Syro-Malabar Catholic Church',
  shortName: 'St. Alphonsa Church',
  city: 'Austin',
  tagline: 'Our new home is taking shape. Come explore the campus.',      // PLACEHOLDER
  address: '3600 Co Rd 175, Leander, TX 78641',
  phone: '(512) 000-0000',                                                // PLACEHOLDER
  email: 'office@stalphonsaaustin.org',                                   // PLACEHOLDER
  website: '',                                                            // PLACEHOLDER optional, e.g. https://stalphonsaaustin.org
  facebook: '',                                                           // PLACEHOLDER optional
  youtube: '',                                                            // PLACEHOLDER optional

  // Holy Qurbana / Mass schedule. Add or remove rows freely.
  massTimes: [
    { day: 'Sunday', time: '10:30 AM', label: 'Holy Qurbana (Malayalam)' },   // PLACEHOLDER
    { day: 'Sunday', time: '9:00 AM', label: 'Catechism (CCD) classes' },     // PLACEHOLDER
    { day: 'Friday', time: '7:00 PM', label: 'Holy Qurbana and Adoration' }   // PLACEHOLDER
  ],
  // Where the community currently gathers while the new campus is built.
  currentLocation: 'Currently worshipping at our temporary location in Austin',  // PLACEHOLDER

  // Capital campaign. Leave donateUrl empty to hide the button.
  donateUrl: '',                                                          // PLACEHOLDER e.g. https://...
  donateLabel: 'Support the Build',

  // Project story shown under the map.
  projectTitle: 'Building a home for our parish family',                  // PLACEHOLDER
  projectStory: 'On 4.9 acres along County Road 175, our parish is building a new church, a catechism and community building, basketball courts, and a shaded campus for generations to come. Groundbreaking and completion dates will be announced here.',   // PLACEHOLDER
  milestones: [
    { when: '2023', what: 'Land acquired: 4.916 acres in Leander' },     // PLACEHOLDER verify
    { when: '2024', what: 'Site plan and building design' },              // PLACEHOLDER
    { when: 'TBD', what: 'Groundbreaking' },                              // PLACEHOLDER
    { when: 'TBD', what: 'First Holy Qurbana in the new church' }         // PLACEHOLDER
  ],

  // Images. Drop files into assets/img/ with exactly these names.
  // Missing files are hidden automatically, nothing breaks.
  images: {
    logo: 'assets/img/logo.png',
    church: 'assets/img/church-rendering.jpg',
    ccd: 'assets/img/ccd-rendering.jpg',
    courts: 'assets/img/courts.jpg',
    parking: 'assets/img/parking.jpg',
    pond: 'assets/img/pond.jpg',
    sitePlan: 'assets/img/site-plan.jpg',
    saint: 'assets/img/st-alphonsa.jpg'
  }
};
