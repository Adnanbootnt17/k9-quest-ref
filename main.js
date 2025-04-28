const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const faker = require('faker');
const readlineSync = require('readline-sync'); // Tambahkan readline-sync

// Load semua refcode dari ref.txt
const refs = fs.readFileSync('ref.txt', 'utf8').split('\n').filter(Boolean);

// Fungsi untuk generate random wallet address
function randomWallet() {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

// Fungsi untuk generate random username
function randomUsername() {
  return faker.name.firstName() + faker.name.lastName(); // Nama acak
}

// Fungsi untuk register
async function register(refCode) {
  const walletAddress = randomWallet();
  const data = JSON.stringify([walletAddress, "", "", refCode]);

  const config = {
    method: 'POST',
    url: `https://quest.k9finance.com/login?refcode=${refCode}&redirect_to=%2F`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/x-component',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'text/plain',
      'sec-ch-ua-platform': '"Android"',
      'next-action': '78728c053c2d628d21a9de862f681aaf313e77901f',
      'sec-ch-ua': '"Chromium";v="130", "Mises";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'next-router-state-tree': encodeURIComponent(`["",{"children":["login",{"children":["__PAGE__?{\\"refcode\\":\\"${refCode}\\",\\"redirect_to\\":\\"/\\"}",{}, "/login?refcode=${refCode}&redirect_to=%2F","refresh"]}]}],null,null,true]`),
      'origin': 'https://quest.k9finance.com',
      'referer': `https://quest.k9finance.com/login?refcode=${refCode}&redirect_to=%2F`,
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i'
    },
    data: data,
    maxRedirects: 0, // Supaya gak auto follow redirect
    validateStatus: function (status) {
      return status >= 200 && status < 400; // Terima 3xx juga
    }
  };

  try {
    const response = await axios.request(config);
    const setCookie = response.headers['set-cookie'];

    if (!setCookie) {
      console.error(`Gagal ambil cookie setelah register wallet ${walletAddress}`);
      return;
    }

    // Gabung cookies jadi satu string
    const cookieString = setCookie.map(cookie => cookie.split(';')[0]).join('; ');

    console.log(`Sukses regis wallet ${walletAddress} ref ${refCode}`);

    // Langsung onboarding pakai cookie
    await onboarding(cookieString);

  } catch (error) {
    console.error(`Gagal regis dengan ref ${refCode}:`, error.response?.data || error.message);
  }
}

// Fungsi untuk onboarding
async function onboarding(cookie) {
  const username = randomUsername(); // Ambil username acak
  const data = JSON.stringify({ username }); // Kirim data dengan username acak

  const config = {
    method: 'POST',
    url: 'https://quest.k9finance.com/onboarding?connected=x',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/x-component',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json', // Ganti Content-Type jadi application/json
      'sec-ch-ua-platform': '"Android"',
      'next-action': '0089092e4dd04df7203298a20b00a8fd35f4531b30',
      'sec-ch-ua': '"Chromium";v="130", "Mises";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22onboarding%22%2C%7B%22children%22%3A%5B%22__PAGE__%3F%7B%5C%22connected%5C%22%3A%5C%22x%5C%22%7D%22%2C%7B%7D%2C%22%2Fonboarding%3Fconnected%3Dx%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'origin': 'https://quest.k9finance.com',
      'referer': 'https://quest.k9finance.com/onboarding?connected=x',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i',
      'Cookie': cookie // <-- pakai cookie hasil register
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    console.log('Sukses onboarding');
  } catch (error) {
    console.error('Gagal onboarding:', error.response?.data || error.message);
  }
}

// Main jalan semua
(async () => {
  // Menu input untuk menentukan berapa kali proses dibuat
  const repeatCount = readlineSync.questionInt('Berapa kali ingin menjalankan proses register dan onboarding? ');

  for (let i = 0; i < repeatCount; i++) {
    console.log(`\nProses ke-${i + 1}`);
    for (const ref of refs) {
      await register(ref.trim());
      await new Promise(r => setTimeout(r, 2000)); // delay 2 detik antar register
    }
  }
})();
