async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(url, res.status);
  } catch (e) {
    console.error(url, e.message);
  }
}
async function run() {
  await checkUrl('https://everyayah.com/data/Minshawy_Teacher_128kbps/001001.mp3');
  await checkUrl('https://everyayah.com/data/Menshawi_32kbps/001001.mp3');
  await checkUrl('https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3');
  await checkUrl('https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/001001.mp3');
}
run();
