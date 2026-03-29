const https = require('https');

https.get('https://api.quran.com/api/v4/resources/recitations?language=ar', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const recitations = json.recitations || [];
      const husary = recitations.filter(r => r.reciter_name.toLowerCase().includes('husar') || r.translated_name.name.includes('الحصري'));
      console.log("Husary reciters found:");
      console.log(JSON.stringify(husary, null, 2));
      
      const teacher = recitations.filter(r => r.style === 'Muallim' || r.translated_name.name.includes('معلم') || r.translated_name.name.includes('أطفال'));
      console.log("Teacher reciters found:");
      console.log(JSON.stringify(teacher, null, 2));
    } catch(e) {
      console.log("Error parsing:", e);
    }
  });
}).on('error', e => console.log(e));
