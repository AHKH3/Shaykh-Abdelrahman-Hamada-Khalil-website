const https = require('https');

const basenames = [
  'Husary_Teacher_Children_128kbps',
  'Husary_Teacher_Children_64kbps',
  'Husary_Muallim_Children_128kbps',
  'Husary_Muallim_Children_64kbps',
  'Husary_Children_128kbps',
  'Husary_Children_64kbps',
  'Husary_Kids_128kbps',
  'Husary_Kids_64kbps',
  'AlHusary_Teacher_Children_128kbps',
  'AlHusary_Muallim_128kbps',
  'Husary_Teacher_128kbps',
  'Husary_Muallim_Teacher_128kbps'
];

async function checkUrl(slug) {
  return new Promise((resolve) => {
    const url = `https://everyayah.com/data/${slug}/001001.mp3`;
    https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 301) {
        console.log("FOUND:", slug);
      }
      resolve();
    }).on('error', () => resolve()).end();
  });
}

(async () => {
  for(let slug of basenames) {
    await checkUrl(slug);
  }
  console.log("Done testing URLs");
})();
