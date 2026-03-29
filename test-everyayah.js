const https = require('https');

https.get('https://everyayah.com/data/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const regex = /href="([^"]+)"/g;
    let match;
    const links = [];
    while ((match = regex.exec(data)) !== null) {
      links.push(match[1]);
    }
    const husary = links.filter(l => l.toLowerCase().includes('husar') || l.toLowerCase().includes('hosar'));
    const children = links.filter(l => l.toLowerCase().includes('child') || l.toLowerCase().includes('kid') || l.toLowerCase().includes('teach') || l.toLowerCase().includes('mual'));
    
    console.log("Husary links:", husary);
    console.log("Children/Teacher links:", children);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
