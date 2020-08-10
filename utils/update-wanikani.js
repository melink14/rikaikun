/*
 * SPDX-FileCopyrightText: 2020 Erek Speed <melink14@gmail.com>
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
const fs = require('fs').promises;
const https = require('https');
const path = require('path');

const apiEndpoint = new URL('https://api.wanikani.com/v2/subjects?types=kanji');
const headers = {
  Authorization: 'Bearer ' + process.env.WK_API_TOKEN,
};

loadWanikani();

/** Update */
async function loadWanikani() {
  let currentData = await loadCachedWanikani();
  const completeKanji = [];
  let nextUrl = apiEndpoint;
  if (currentData.get('date')) {
    nextUrl.searchParams.set(
      'updated_after',
      new Date(currentData.get('date')).toJSON()
    );
  }
  while (nextUrl !== null) {
    let kanji;
    ({ kanji, nextUrl } = await fetchKanji(nextUrl));
    completeKanji.push(...kanji);
  }
  console.log(`New kanji: ${completeKanji.length}`);
  if (completeKanji.length > 0) {
    const filtered = completeKanji.map((kanji) => {
      return [
        kanji.data.characters,
        {
          level: kanji.data.level,
          meaning: getPrimaryMeaning(kanji.data.meanings),
        },
      ];
    });
    filtered.push(['date', Date.now()]);
    fs.createWriteStream(
      path.join(__dirname, '..', 'extension', 'data', 'wanikani.json')
    ).end(JSON.stringify(filtered));
    currentData = new Map([...currentData, ...filtered]);
  }
  return currentData;
}

/**
 * Given an `Array` of Wanikani `meanings`, returns the primary one. See
 * https://docs.api.wanikani.com/20170710/#subject-data-structure
 *
 * @param {Array} meanings
 * @returns {String}
 */
function getPrimaryMeaning(meanings) {
  return meanings.find((meaning) => meaning.primary).meaning;
}

/**
 * Returns a promise local JSON serialized cache of useful wanikani kanji data.
 * Cat This is what I tell myself.
 *
 * @returns {Promise<Map>}
 */
async function loadCachedWanikani() {
  const data = await fs.readFile(
    path.join(__dirname, '..', 'extension', 'data', 'wanikani.json'),
    'utf8'
  );
  if (data.length > 0) {
    resolve(new Map(JSON.parse(data)));
  } else {
    resolve(new Map());
  }
}

/** @param {string} url Wanikani api endpoint. */
async function fetchKanji(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: headers }, (response) => {
      const { statusCode } = response;
      console.log(response.headers['last-modified']);
      console.log(response.headers['etag']);
      response.setEncoding('utf8');
      let rawData = '';
      response.on('data', (chunk) => {
        rawData += chunk;
      });
      response.on('end', () => {
        const parsedData = JSON.parse(rawData);
        if (statusCode !== 200) {
          reject(
            new Error(
              `Request Failed with Status: ${statusCode}\nError: ${parsedData.error}`
            )
          );
        } else {
          const nextUrl = parsedData.pages.next_url;
          resolve({ kanji: parsedData.data, nextUrl: nextUrl });
        }
      });
    });
  });
}

module.exports = loadWanikani;
