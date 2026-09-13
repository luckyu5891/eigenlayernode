/* =====================================================================
   CHURCH CONFIG  |  Edit this one file to personalise the site.
   Sourced from stalphonsaaustin.com (September 2026). Lines marked
   PLACEHOLDER or VERIFY still need the parish to confirm.
   See CONTENT-CHECKLIST.md for the full list.
   ===================================================================== */
window.CHURCH = {
  name: 'St. Alphonsa Syro-Malabar Catholic Church',
  shortName: 'St. Alphonsa Church',
  city: 'Austin',
  diocese: 'St. Thomas Syro-Malabar Catholic Diocese of Chicago',
  vicar: 'Fr. Anto G. Alappat',                                             // VERIFY spelling with the parish
  tagline: 'A long-cherished dream of our families is taking shape in Leander.',
  address: '3600 Co Rd 175, Leander, TX 78641',
  phone: '(512) 740-2262',
  email: 'trustees@stalphonsaaustin.com',
  website: 'https://www.stalphonsaaustin.com',
  projectUrl: 'https://www.stalphonsaaustin.com/new-church-project.html',
  facebook: 'https://www.facebook.com/stalphonsacatholicchurch/',
  youtube: 'https://www.youtube.com/user/stalphonsa',

  // Holy Qurbana schedule (school-year schedule from stalphonsaaustin.com).
  // Summer schedule on the site: Sunday 9:00 AM Malayalam, 11:45 AM English.
  massTimes: [
    { day: 'Sunday', time: '9:30 AM', label: 'Holy Qurbana (Malayalam)' },
    { day: 'Sunday', time: '9:30 AM', label: 'CCD classes' },
    { day: 'Sunday', time: '11:00 AM', label: 'Holy Qurbana (English)' },
    { day: 'Sunday', time: '12:30 PM', label: 'Malayalam class' },
    { day: 'Tue and Fri', time: '7:00 PM', label: 'Holy Qurbana (Malayalam)' },
    { day: 'Wed, Thu, Sat', time: '9:00 AM', label: 'Holy Qurbana (Malayalam)' }
  ],
  // The Manor church (8701 Burleson Manor Rd) has been sold. Confirm where the parish gathers during construction.
  currentLocation: 'Worship location during construction: see stalphonsaaustin.com for the latest.',   // PLACEHOLDER

  // Capital campaign. Leave donateUrl empty to hide the button.
  donateUrl: 'https://www.stalphonsaaustin.com/new-church-project.html',   // VERIFY: replace with the direct giving link if one exists
  donateLabel: 'Support the New Church',

  // Project story, in the parish's own words from the New Church Project page.
  projectTitle: 'Our New Church Project',
  projectStory: 'The construction of our new church is a long-cherished dream of our families. It is about building a spiritual home where generations can encounter Christ, celebrate their faith, and carry forward our rich Syro-Malabar liturgical heritage. Our parish belongs to the St. Thomas Syro-Malabar Catholic Diocese of Chicago.',
  milestones: [
    { when: 'Approved', what: 'General Body approves the New Church Project and the purchase of land in Leander' },
    { when: 'Purchased', what: '4.9 acres acquired at 3600 County Road 175, Leander' },
    { when: 'Blessed', what: 'Mar Joy Alappatt blesses the new property and breaks ground for the Phase 1 building' },
    { when: 'Blessed', what: 'Rectory blessed by Mar Joy Alappatt' },
    { when: 'Completed', what: 'Manor church property handed over and sale completed' },
    { when: 'Next', what: 'Phase 1 construction, then the church sanctuary for 400' }   // PLACEHOLDER dates
  ],

  // Images. Drop files into assets/img/ with exactly these names.
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
