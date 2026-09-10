/* =====================================================================
   CONTENT DATA  |  Verses, trivia, clues, word lists.
   Safe to edit: add or remove items and the games adapt automatically.
   ===================================================================== */
window.DATA = {

  /* ---------- Campus buildings (single source of truth) ---------- */
  buildings: [
    { id: 'sanctuary', name: 'Sanctuary', icon: '⛪', page: 'sanctuary.html',
      blurb: 'Worship times, verse of the day, and the Scripture Scramble game.' },
    { id: 'arcade', name: 'Fellowship Hall Arcade', icon: '🕹️', page: 'arcade.html',
      blurb: 'Manna Catch, Word Search, and Bible Trivia.' },
    { id: 'tower', name: 'Bell Tower', icon: '🔔', page: 'tower.html',
      blurb: 'Start the campus Treasure Hunt and collect six hidden relics.' },
    { id: 'kids', name: "Children's Wing", icon: '🎨', page: 'kids.html',
      blurb: "Noah's Ark Memory Match and a Coloring Book." },
    { id: 'garden', name: 'Prayer Garden', icon: '🌿', page: 'garden.html',
      blurb: 'Leave a prayer on the wall and take a quiet moment.' },
    { id: 'welcome', name: 'Welcome Center', icon: '👋', page: 'welcome.html',
      blurb: 'Plan your visit, what to expect, and how to reach us.' }
  ],

  /* ---------- Verse of the day (rotates by calendar day) ---------- */
  dailyVerses: [
    { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
    { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
    { text: 'I can do all things through him who strengthens me.', ref: 'Philippians 4:13' },
    { text: 'Trust in the Lord with all your heart.', ref: 'Proverbs 3:5' },
    { text: 'Let your light shine before others.', ref: 'Matthew 5:16' },
    { text: 'Love your neighbor as yourself.', ref: 'Mark 12:31' },
    { text: 'Rejoice in the Lord always.', ref: 'Philippians 4:4' },
    { text: 'The Lord is near to all who call on him.', ref: 'Psalm 145:18' },
    { text: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
    { text: 'This is the day that the Lord has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' },
    { text: 'Do everything in love.', ref: '1 Corinthians 16:14' },
    { text: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
    { text: 'Come to me, all who labor and are heavy laden, and I will give you rest.', ref: 'Matthew 11:28' },
    { text: 'Give thanks to the Lord, for he is good; his love endures forever.', ref: 'Psalm 107:1' }
  ],

  /* ---------- Scripture Scramble (Sanctuary) ---------- */
  scrambleVerses: [
    { text: 'The Lord is my shepherd I shall not want', ref: 'Psalm 23:1' },
    { text: 'Be still and know that I am God', ref: 'Psalm 46:10' },
    { text: 'Trust in the Lord with all your heart', ref: 'Proverbs 3:5' },
    { text: 'Let your light shine before others', ref: 'Matthew 5:16' },
    { text: 'Love your neighbor as yourself', ref: 'Mark 12:31' },
    { text: 'Rejoice in the Lord always', ref: 'Philippians 4:4' },
    { text: 'Do everything in love', ref: '1 Corinthians 16:14' },
    { text: 'The joy of the Lord is your strength', ref: 'Nehemiah 8:10' },
    { text: 'Seek and you will find', ref: 'Matthew 7:7' },
    { text: 'Your word is a lamp to my feet', ref: 'Psalm 119:105' }
  ],

  /* ---------- Bible Trivia (Arcade) ---------- */
  trivia: [
    { q: 'How many days did God take to create the world before resting?', a: ['Five', 'Six', 'Seven', 'Forty'], c: 1, ref: 'Genesis 2:2' },
    { q: 'Who built an ark to survive the great flood?', a: ['Moses', 'Abraham', 'Noah', 'Jonah'], c: 2, ref: 'Genesis 6' },
    { q: 'What did David use to defeat Goliath?', a: ['A sword', 'A slingshot and stone', 'A spear', 'A bow'], c: 1, ref: '1 Samuel 17' },
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
    { q: 'Who was the strong man whose hair was cut?', a: ['Gideon', 'Samson', 'Saul', 'Esau'], c: 1, ref: 'Judges 16' },
    { q: 'Which sea did Moses part?', a: ['Dead Sea', 'Sea of Galilee', 'Red Sea', 'Mediterranean'], c: 2, ref: 'Exodus 14' },
    { q: 'How many books are in the New Testament?', a: ['27', '39', '66', '12'], c: 0, ref: 'New Testament' },
    { q: 'Who was the mother of Jesus?', a: ['Martha', 'Mary', 'Elizabeth', 'Ruth'], c: 1, ref: 'Luke 1' },
    { q: 'What did the wise men follow to find Jesus?', a: ['A map', 'A river', 'A star', 'A dove'], c: 2, ref: 'Matthew 2' },
    { q: 'Who wrote most of the Psalms?', a: ['Solomon', 'David', 'Isaiah', 'Paul'], c: 1, ref: 'Psalms' },
    { q: 'What did Jesus ride into Jerusalem?', a: ['A horse', 'A camel', 'A donkey', 'A chariot'], c: 2, ref: 'Matthew 21' },
    { q: 'Who was sold into slavery by his brothers?', a: ['Benjamin', 'Joseph', 'Jacob', 'Isaac'], c: 1, ref: 'Genesis 37' },
    { q: 'What fell from heaven to feed Israel in the wilderness?', a: ['Bread', 'Manna', 'Fish', 'Figs'], c: 1, ref: 'Exodus 16' },
    { q: 'How many days was Jesus in the tomb?', a: ['One', 'Three', 'Seven', 'Forty'], c: 1, ref: 'Luke 24' },
    { q: 'Who climbed a tree to see Jesus?', a: ['Zacchaeus', 'Nicodemus', 'Lazarus', 'Bartimaeus'], c: 0, ref: 'Luke 19' },
    { q: 'What was the name of the garden where Adam and Eve lived?', a: ['Gethsemane', 'Eden', 'Canaan', 'Zion'], c: 1, ref: 'Genesis 2' },
    { q: 'Which apostle was a tax collector?', a: ['Matthew', 'Andrew', 'James', 'Philip'], c: 0, ref: 'Matthew 9:9' },
    { q: 'What did Jesus walk on?', a: ['Fire', 'Clouds', 'Water', 'Glass'], c: 2, ref: 'Matthew 14' },
    { q: 'Who was the wisest king of Israel?', a: ['Saul', 'David', 'Solomon', 'Hezekiah'], c: 2, ref: '1 Kings 3' },
    { q: 'Who baptised Jesus?', a: ['Peter', 'John the Baptist', 'James', 'Paul'], c: 1, ref: 'Matthew 3' },
    { q: 'How many plagues struck Egypt?', a: ['Seven', 'Ten', 'Twelve', 'Forty'], c: 1, ref: 'Exodus 7-12' }
  ],

  /* ---------- Word Search (Arcade) ---------- */
  wordBank: ['FAITH', 'HOPE', 'LOVE', 'GRACE', 'PRAYER', 'PEACE', 'MERCY', 'LIGHT', 'TRUTH', 'PSALM', 'ANGEL', 'SHEPHERD', 'DISCIPLE', 'CHURCH', 'BLESSING', 'GLORY', 'SPIRIT', 'PRAISE', 'BREAD', 'SHALOM'],

  /* ---------- Memory Match (Kids) ---------- */
  arkAnimals: ['🦁', '🐘', '🦒', '🐒', '🦓', '🐑', '🦆', '🐢', '🐧', '🦊'],

  /* ---------- Treasure Hunt (Bell Tower) ---------- */
  hunt: [
    { target: 'sanctuary', item: 'Golden Key', emoji: '🗝️', word: 'Seek',
      clue: 'Where voices rise in song and the cross stands highest of all, begin beneath the steeple.',
      hint: 'It is the tallest building with a cross on top.' },
    { target: 'tower', item: 'Brass Bell', emoji: '🔔', word: 'and',
      clue: 'I count the hours and call the faithful, though I have no mouth to speak.',
      hint: 'Something rings inside me every Sunday morning.' },
    { target: 'arcade', item: 'Wooden Puzzle Piece', emoji: '🧩', word: 'you',
      clue: 'Bread is broken, games are played, and laughter fills the room. Find me where friends gather.',
      hint: 'Look for the long green roof.' },
    { target: 'kids', item: 'Box of Crayons', emoji: '🖍️', word: 'will',
      clue: 'Small chairs, bright colors, and a slide outside. The littlest ones know me best.',
      hint: 'It is the most colourful building on campus.' },
    { target: 'garden', item: 'Pressed Flower', emoji: '🌸', word: 'find',
      clue: 'Among the hedges and the fountain\'s song, quiet hearts find rest. Look near the gazebo.',
      hint: 'There is no roof here, just hedges and water.' },
    { target: 'welcome', item: 'Welcome Scroll', emoji: '📜', word: 'Matthew 7:7',
      clue: 'Every journey starts with a greeting. Find me where newcomers first arrive.',
      hint: 'It sits right beside the front path.' }
  ],

  /* ---------- Coloring pages (Kids) ---------- */
  coloringPalette: ['#e63946', '#f4a261', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff70a6', '#8d5524', '#2b2a28', '#ffffff']
};
