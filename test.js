const https = require('https');
const fs = require('fs');

https.get('https://everyayah.com/data/', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    fs.writeFileSync('/tmp/everyayah.txt', data);
    console.log("Written length:", data.length);
  });
});
