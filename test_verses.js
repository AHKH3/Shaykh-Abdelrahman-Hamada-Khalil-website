const https = require('https');
https.get('https://verses.quran.com/Ibrahim_Akhdar_32kbps/001001.mp3', (res) => {
  console.log('Status code:', res.statusCode);
});
