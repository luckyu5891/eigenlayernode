/* =====================================================================
   CONTENT DATA  |  Map items, facts, treasure hunt, trivia, word lists.
   PLACEHOLDER marks facts to verify or fill in. Keep item ids unchanged.
   ===================================================================== */
window.DATA = {

  /* ---------- The five map items (single source of truth) ---------- */
  items: [
    {
      id: 'church', name: 'St. Alphonsa Church', kind: 'Sanctuary and parish church', icon: '⛪',
      game: 'treasure', gameName: 'Treasure Hunt', gameBlurb: 'Follow five clues around the campus and uncover a hidden verse.',
      imageKey: 'church',
      meta: [
        ['Footprint', '125 × 82 ft'], ['Floor area', '10,250 sq ft'],
        ['Seats', '400'], ['Style', 'Gothic arches, Texas limestone']        // PLACEHOLDER verify style
      ],
      description: 'The heart of the new campus. A single-nave church with a stone gable façade, a statue of St. Alphonsa above the entrance, tall arched windows, and room for 400 worshippers at Holy Qurbana.',   // PLACEHOLDER
      facts: [
        'The sanctuary faces the main drive so the cross greets everyone arriving from County Road 175.',
        'Limestone on the façade echoes the Texas Hill Country while the pointed arches recall Kerala\'s historic Syro-Malabar churches.',   // PLACEHOLDER verify
        'St. Alphonsa (1910 to 1946) was the first woman of Indian origin to be canonised, in 2008.',
        'Finished floor sits at 888.5 ft above sea level, about a foot below the CCD building next door.'
      ]
    },
    {
      id: 'ccd', name: 'CCD Building', kind: 'Catechism classrooms and community hall', icon: '🏫',
      game: 'arcade', gameName: 'Arcade', gameBlurb: 'Four quick games: Manna Catch, Word Search, Bible Trivia, and Memory Match.',
      imageKey: 'ccd',
      meta: [
        ['Footprint', '125 × 82 ft'], ['Floor area', '10,250 sq ft'],
        ['Classrooms', '10'],                                                   // PLACEHOLDER
        ['Hall capacity', '300']                                               // PLACEHOLDER
      ],
      description: 'A multi-purpose building for catechism (CCD) classes on Sunday mornings, youth programs, parish meals, and community celebrations. Its covered stone entry mirrors the church next door.',   // PLACEHOLDER
      facts: [
        'Same footprint as the church but turned ninety degrees, so the two buildings frame the courts and the loop between them.',
        'Classrooms convert to one large hall for feasts, weddings, and Onam and Christmas celebrations.',   // PLACEHOLDER
        'A gravel fire lane loops behind the building, rated for a 75,000 lb fire truck.',
        'Accessible parking sits right at the entrance for the youngest and oldest parishioners.'
      ]
    },
    {
      id: 'courts', name: 'Basketball Courts', kind: 'Outdoor recreation', icon: '🏀',
      game: 'basketball', gameName: 'Hoops', gameBlurb: 'Flick to shoot. Sixty seconds, moving hoop, beat your best.',
      imageKey: 'courts',
      meta: [
        ['Courts', '2 half courts'], ['Each court', '60 × 30 ft'],
        ['Total area', '3,600 sq ft'], ['Surface', 'Concrete, painted']     // PLACEHOLDER verify
      ],
      description: 'Two side-by-side courts between the church and the CCD building, where youth group, altar servers, and dads with something to prove will meet after Qurbana.',   // PLACEHOLDER
      facts: [
        'Two courts means two games at once, or one full-court game for tournaments.',
        'Placed on the west side so the buildings shade the courts in the late afternoon.',
        'Court lighting and benches are planned in a later phase.'               // PLACEHOLDER
      ]
    },
    {
      id: 'parking', name: 'Parking', kind: 'Loop drive and parking bays', icon: '🚗',
      game: 'parking', gameName: 'Park It', gameBlurb: 'Steer into the marked space without a scratch. Three levels.',
      imageKey: 'parking',
      meta: [
        ['Spaces', 'About 120'],                                                // PLACEHOLDER verify exact count
        ['Accessible', '8'],                                                    // PLACEHOLDER
        ['Entrance', 'Straight drive from CR 175'], ['Layout', 'One-way loop']
      ],
      description: 'The entrance drive runs straight in from County Road 175, between the two ponds, to the church doors. A one-way loop then wraps around the church with parking bays on both sides, so drop-off is easy and nobody reverses into traffic.',   // PLACEHOLDER
      facts: [
        'The entrance has a 6 ft sliding wrought-iron gate with a Knox key switch so fire crews can enter any time.',
        'The whole loop is sized for fire trucks to circle the church without stopping.',
        'Overflow parking on feast days uses the gravel lane behind the CCD building.'   // PLACEHOLDER
      ]
    },
    {
      id: 'pond', name: 'Detention Ponds', kind: 'Stormwater and water quality', icon: '🌊',
      game: 'fishing', gameName: 'Gone Fishing', gameBlurb: 'Cast, wait for the bite, reel it in. Every catch unlocks a pond fact.',
      imageKey: 'pond',
      meta: [
        ['Ponds', '2, matching'], ['Spillway', '20 ft wide at 882.25 ft'],
        ['Purpose', 'Flood control and filtration'], ['Location', 'Either side of the entrance']
      ],
      description: 'Two matching basins flank the entrance drive along the road frontage. They slow rainwater rushing off roofs and parking and clean it before it leaves the property.',   // PLACEHOLDER
      facts: [
        'Texas storms can drop inches of rain in an hour. The pond holds that surge and releases it slowly.',
        'A splitter box sends the first, dirtiest flush of runoff to the sedimentation basin for cleaning.',
        'When dry, the ponds are grassy meadows framing the entrance. Fishing is strictly a game here.',
        'A 20 ft emergency spillway protects the road if the pond ever overtops.'
      ]
    }
  ],

  /* ---------- Treasure Hunt (5 clues, one per map item) ---------- */
  hunt: [
    { target: 'church', item: 'Golden Key', emoji: '🗝️', word: 'Seek',
      clue: 'Four hundred seats face east, and a cross stands highest of all. Start where the parish will gather.',
      hint: 'It is the biggest building, with the cross on the roof.',
      fact: 'St. Alphonsa was born Anna Muttathupadathu in Kudamaloor, Kerala, in 1910.' },
    { target: 'pond', item: 'Blue Marble', emoji: '🔵', word: 'and',
      clue: 'I fill when the sky opens and empty when it clears. I keep the road dry and the creek clean.',
      hint: 'Look beside the entrance drive, where the ground dips on both sides.',
      fact: 'She took the name Alphonsa in honour of St. Alphonsus Liguori when she entered the Franciscan Clarist Congregation.' },
    { target: 'courts', item: 'Bronze Whistle', emoji: '📣', word: 'you',
      clue: 'Twice sixty by thirty. Where sneakers squeak and the youth group settles arguments.',
      hint: 'Two orange rectangles, west of the church.',
      fact: 'She taught at a school in Vazhappally for a short time before illness confined her to the convent.' },
    { target: 'ccd', item: 'Chalk Box', emoji: '🖍️', word: 'will',
      clue: 'Same size as the church, but here the lessons come with snacks. Sunday mornings start in my rooms.',
      hint: 'The second big building, south-west of the church.',
      fact: 'Pope John Paul II beatified her in Kottayam in 1986. Pope Benedict XVI canonised her on 12 October 2008.' },
    { target: 'parking', item: 'Welcome Scroll', emoji: '📜', word: 'find',
      clue: 'Everyone passes through me, though nobody stays. I run in from the road between two ponds and circle the church.',
      hint: 'Follow the loop drive around the church.',
      fact: 'Her tomb at Bharananganam draws pilgrims from across India and the world every July 28th, her feast day.' }
  ],
  huntVerse: { text: 'Seek and you will find.', ref: 'Matthew 7:7' },

  /* ---------- Bible Trivia (Arcade) ---------- */
  trivia: [
    { q: 'Where was St. Alphonsa born?', a: ['Goa', 'Kudamaloor, Kerala', 'Chennai', 'Mumbai'], c: 1, ref: 'St. Alphonsa' },
    { q: 'In what year was St. Alphonsa canonised?', a: ['1986', '1998', '2008', '2014'], c: 2, ref: 'St. Alphonsa' },
    { q: 'Which apostle is traditionally said to have brought Christianity to Kerala?', a: ['St. Peter', 'St. Thomas', 'St. Paul', 'St. Andrew'], c: 1, ref: 'Syro-Malabar tradition' },
    { q: 'What is the Syro-Malabar name for the Eucharistic liturgy?', a: ['Holy Qurbana', 'Divine Liturgy', 'Holy Mass', 'Raza'], c: 0, ref: 'Syro-Malabar liturgy' },
    { q: 'When is the feast of St. Alphonsa celebrated?', a: ['July 28', 'October 12', 'August 15', 'December 3'], c: 0, ref: 'St. Alphonsa' },
    { q: 'How many days did God take to create the world before resting?', a: ['Five', 'Six', 'Seven', 'Forty'], c: 1, ref: 'Genesis 2:2' },
    { q: 'Who built an ark to survive the great flood?', a: ['Moses', 'Abraham', 'Noah', 'Jonah'], c: 2, ref: 'Genesis 6' },
    { q: 'What did David use to defeat Goliath?', a: ['A sword', 'A sling and stone', 'A spear', 'A bow'], c: 1, ref: '1 Samuel 17' },
    { q: 'Who was swallowed by a great fish?', a: ['Jonah', 'Peter', 'Elijah', 'Daniel'], c: 0, ref: 'Jonah 1:17' },
    { q: 'How many disciples did Jesus choose?', a: ['Seven', 'Ten', 'Twelve', 'Seventy'], c: 2, ref: 'Matthew 10:1' },
    { q: 'In which town was Jesus born?', a: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'], c: 2, ref: 'Luke 2:4' },
    { q: 'What did Jesus turn into wine at a wedding?', a: ['Oil', 'Water', 'Milk', 'Vinegar'], c: 1, ref: 'John 2' },
    { q: 'Who led the Israelites out of Egypt?', a: ['Joshua', 'Moses', 'Aaron', 'Joseph'], c: 1, ref: 'Exodus 12' },
    { q: 'How many loaves fed the five thousand?', a: ['Two', 'Five', 'Seven', 'Twelve'], c: 1, ref: 'Matthew 14:17' },
    { q: 'Who was thrown into the lions den?', a: ['Daniel', 'Samson', 'Elisha', 'Job'], c: 0, ref: 'Daniel 6' },
    { q: 'What is the first book of the Bible?', a: ['Exodus', 'Psalms', 'Genesis', 'Matthew'], c: 2, ref: 'Genesis 1' },
    { q: 'Who denied Jesus three times?', a: ['Judas', 'Thomas', 'John', 'Peter'], c: 3, ref: 'Luke 22' },
    { q: 'What sign did God give Noah after the flood?', a: ['A dove', 'A rainbow', 'A star', 'Fire'], c: 1, ref: 'Genesis 9:13' },
    { q: 'Which sea did Moses part?', a: ['Dead Sea', 'Sea of Galilee', 'Red Sea', 'Mediterranean'], c: 2, ref: 'Exodus 14' },
    { q: 'Who was the mother of Jesus?', a: ['Martha', 'Mary', 'Elizabeth', 'Ruth'], c: 1, ref: 'Luke 1' },
    { q: 'What did the wise men follow to find Jesus?', a: ['A map', 'A river', 'A star', 'A dove'], c: 2, ref: 'Matthew 2' },
    { q: 'What did Jesus ride into Jerusalem?', a: ['A horse', 'A camel', 'A donkey', 'A chariot'], c: 2, ref: 'Matthew 21' },
    { q: 'What fell from heaven to feed Israel in the wilderness?', a: ['Bread', 'Manna', 'Fish', 'Figs'], c: 1, ref: 'Exodus 16' },
    { q: 'How many days was Jesus in the tomb?', a: ['One', 'Three', 'Seven', 'Forty'], c: 1, ref: 'Luke 24' },
    { q: 'Who climbed a tree to see Jesus?', a: ['Zacchaeus', 'Nicodemus', 'Lazarus', 'Bartimaeus'], c: 0, ref: 'Luke 19' },
    { q: 'Which apostle was a tax collector?', a: ['Matthew', 'Andrew', 'James', 'Philip'], c: 0, ref: 'Matthew 9:9' },
    { q: 'Who was the wisest king of Israel?', a: ['Saul', 'David', 'Solomon', 'Hezekiah'], c: 2, ref: '1 Kings 3' },
    { q: 'Who baptised Jesus?', a: ['Peter', 'John the Baptist', 'James', 'Paul'], c: 1, ref: 'Matthew 3' },
    { q: 'How many plagues struck Egypt?', a: ['Seven', 'Ten', 'Twelve', 'Forty'], c: 1, ref: 'Exodus 7-12' },
    { q: 'What did Jesus walk on?', a: ['Fire', 'Clouds', 'Water', 'Glass'], c: 2, ref: 'Matthew 14' }
  ],

  /* ---------- Word Search (Arcade) ---------- */
  wordBank: ['FAITH', 'HOPE', 'LOVE', 'GRACE', 'PRAYER', 'PEACE', 'MERCY', 'LIGHT', 'TRUTH', 'PSALM', 'ANGEL', 'SHEPHERD', 'DISCIPLE', 'CHURCH', 'BLESSING', 'GLORY', 'SPIRIT', 'PRAISE', 'BREAD', 'SHALOM', 'QURBANA', 'KERALA', 'ALPHONSA', 'THOMAS'],

  /* ---------- Memory Match (Arcade) ---------- */
  arkAnimals: ['🦁', '🐘', '🦒', '🐒', '🦓', '🐑', '🦆', '🐢', '🐧', '🦊', '🐄', '🦜'],

  /* ---------- Fishing: catches and the pond facts they unlock ---------- */
  fish: [
    { name: 'Bluegill', emoji: '🐟', pts: 10, fact: 'Detention ponds are usually dry. They fill for a day or two after a storm, then drain slowly through an outlet.' },
    { name: 'Largemouth Bass', emoji: '🐠', pts: 25, fact: 'The pond protects County Road 175: without it, a big storm would send a wall of water off the parking lot into the road.' },
    { name: 'Channel Catfish', emoji: '🐡', pts: 30, fact: 'A splitter box separates the first flush of dirty runoff, which goes to the sedimentation basin to settle out grit and oil.' },
    { name: 'Golden Koi', emoji: '✨', pts: 60, fact: 'The filtration basin at the east corner uses layers of sand and soil to clean water before it leaves the site.' },
    { name: 'Old Boot', emoji: '🥾', pts: 2, fact: 'Please do not actually fish here. When it is dry, it makes a fine meadow for a picnic.' },
    { name: 'Texas Turtle', emoji: '🐢', pts: 15, fact: 'A 20 ft wide emergency spillway at 882.25 ft lets extreme storms overflow safely instead of over the banks.' }
  ]
};
