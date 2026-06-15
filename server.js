import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { parse } from 'node-html-parser';
import * as muse from 'libmuse';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, statSync } from 'fs';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3737;
const JWT_SECRET = process.env.JWT_SECRET || 'isan-secret-key-2025';
const OTAKUDESU = 'https://otakudesu.blog';
const JIKAN = 'https://api.jikan.moe/v4';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SERVER_PRIORITY = { mega: 10, ondesuhd: 9, ondesu3: 8, vidhide: 7, filedon: 6, zippyshare: 5, otakuwatch: 4 };

// ─── Groq AI ──────────────────────────────────────────────────────────────────
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// ─── JSON DB ──────────────────────────────────────────────────────────────────
const DB_PATH = join(__dirname, 'db.json');
function loadDB() { if (!existsSync(DB_PATH)) return { users: [] }; return JSON.parse(readFileSync(DB_PATH, 'utf-8')); }
function saveDB(data) { writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

// ─── Anime list (dari otakudesu scraping) ─────────────────────────────────────
const ANIME_LIST = JSON.parse(readFileSync(join(__dirname, 'anime_list.json'), 'utf-8'));

// ─── libmuse ──────────────────────────────────────────────────────────────────
try { muse.setup({ location: 'ID', language: 'id' }); } catch (_) {}
function mapSong(item) {
  if (!item) return null;
  const videoId = item.videoId ?? item.video_id ?? item.id ?? null;
  const thumbnails = item.thumbnails ?? item.thumbnail?.thumbnails ?? [];
  const thumbnailUrl = Array.isArray(thumbnails) && thumbnails.length ? thumbnails[thumbnails.length - 1]?.url : '';
  const artist = item.artists?.[0]?.name ?? item.author ?? item.byline ?? '';
  const durationSeconds = item.duration?.totalSeconds ?? item.duration_seconds ?? 0;
  return { videoId, title: item.title ?? '', artist, thumbnailUrl, durationSeconds };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const fetchHTML = async (url) => {
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, Referer: OTAKUDESU },
    timeout: 20000,
  });
  return res.data;
};

const ajaxPost = async (body, referer) => {
  const res = await fetch(new URL('/wp-admin/admin-ajax.php', OTAKUDESU), {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: referer,
      Origin: OTAKUDESU,
      'User-Agent': UA,
    },
  });
  return res.json();
};

const jikanGet = async (path, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(`${JIKAN}${path}`, { params, timeout: 15000 });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
};

// ─── Otakudesu full index ─────────────────────────────────────────────────────
let otakuIndex = new Map();
let indexReady = false;

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function buildOtakuIndex() {
  console.log('[ISAN] Building otakudesu index...');
  try {
    const letters = 'abcdefghijklmnopqrstuvwxyz0'.split('');
    let total = 0;
    for (const letter of letters) {
      try {
        const html = await fetchHTML(`${OTAKUDESU}/anime/?huruf=${letter}`);
        const doc = parse(html, { parseNoneClosedTags: true });
        doc.querySelectorAll('ul.jajalr li a, .jdlbar a').forEach(a => {
          const href = a.getAttribute('href') ?? '';
          const title = a.text.trim();
          const m = href.match(/\/anime\/([^/]+)\//);
          if (m && title && title.length > 1) {
            otakuIndex.set(normalizeTitle(title), { slug: m[1], title });
            total++;
          }
        });
        await new Promise(r => setTimeout(r, 300));
      } catch (e) { console.error(`Letter ${letter}:`, e?.message); }
    }
    console.log(`[ISAN] Index built: ${total} anime`);
    indexReady = true;
  } catch (e) {
    console.error('[ISAN] Index build failed:', e?.message);
    indexReady = true;
  }
}

// ─── Slug finder (Levenshtein fuzzy) ─────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function similarity(a, b) {
  const na = normalizeTitle(a), nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshtein(na, nb) / maxLen;
}

function generateVariants(titleEn, titleRomaji) {
  const variants = new Set();
  const add = (t) => {
    if (!t) return;
    variants.add(t);
    const noSeason = t.replace(/\s+(season|part|cour|s)\s*\d+/gi, '').replace(/\s+\d+(st|nd|rd|th)\s+season/gi, '').replace(/:\s*.+$/, '').trim();
    if (noSeason !== t) variants.add(noSeason);
    variants.add(t.replace(/[!?]/g, '').trim());
    if (t.includes(':')) variants.add(t.split(':')[0].trim());
    if (t.includes(' - ')) variants.add(t.split(' - ')[0].trim());
  };
  add(titleEn); add(titleRomaji);
  return [...variants].filter(Boolean);
}

const slugCache = new Map();

async function findOtakuSlug(titleEn, titleRomaji) {
  const variants = generateVariants(titleEn, titleRomaji);

  if (indexReady && otakuIndex.size > 0) {
    let bestSlug = '', bestScore = 0;
    for (const variant of variants) {
      const exact = otakuIndex.get(normalizeTitle(variant));
      if (exact) return exact.slug;
      for (const [normTitle, entry] of otakuIndex) {
        const score = similarity(variant, normTitle);
        if (score > bestScore && score >= 0.82) { bestScore = score; bestSlug = entry.slug; }
      }
    }
    if (bestSlug) return bestSlug;
  }

  for (const variant of variants) {
    try {
      const html = await fetchHTML(`${OTAKUDESU}/?s=${encodeURIComponent(variant)}&post_type=anime`);
      const doc = parse(html, { parseNoneClosedTags: true });
      const results = doc.querySelectorAll('ul.chivsrc li');
      let bestSlug = '', bestScore = 0;
      results.forEach(li => {
        const a = li.querySelector('h2 a') ?? li.querySelector('a');
        if (!a) return;
        const href = a.getAttribute('href') ?? '';
        const resultTitle = a.text.trim();
        const m = href.match(/\/anime\/([^/]+)\//);
        if (!m) return;
        const score = Math.max(similarity(titleEn, resultTitle), similarity(titleRomaji, resultTitle), similarity(variant, resultTitle));
        if (score > bestScore) { bestScore = score; bestSlug = m[1]; }
      });
      if (bestSlug && bestScore >= 0.65) return bestSlug;
      if (bestSlug && bestScore >= 0.5 && results.length === 1) return bestSlug;
    } catch { continue; }
  }
  return '';
}

// ─── Episode map cache ────────────────────────────────────────────────────────
const epMapCache = new Map();
const EP_CACHE_TTL = 24 * 60 * 60 * 1000;

async function getEpMap(slug) {
  const cached = epMapCache.get(slug);
  if (cached && Date.now() - cached.ts < EP_CACHE_TTL) return cached.map;
  const map = new Map();
  try {
    const html = await fetchHTML(`${OTAKUDESU}/anime/${slug}/`);
    const doc = parse(html, { parseNoneClosedTags: true });
    doc.querySelectorAll('.episodelist li a, .keyingpost li a').forEach(a => {
      const href = a.getAttribute('href') ?? '';
      const m = href.match(/\/episode\/([^/]+)\//);
      const epId = m ? m[1] : '';
      const numM = a.text.trim().match(/Episode\s+(\d+)/i);
      const epNum = numM ? parseInt(numM[1]) : 0;
      if (epId && epNum) map.set(epNum, epId);
    });
    epMapCache.set(slug, { map, ts: Date.now() });
  } catch {}
  return map;
}

// ─── Server scraper ───────────────────────────────────────────────────────────
async function scrapeServers(episodeId) {
  const url = `${OTAKUDESU}/episode/${episodeId}/`;
  try {
    const html = await fetchHTML(url);
    const doc = parse(html, { parseNoneClosedTags: true });

    const defaultStreamingUrl = doc.querySelector('.player-embed iframe')?.getAttribute('src') ?? '';

    const credentials = [...new Set([...html.matchAll(/action:"([^"]+)"/g)].map(m => m[1]))];
    const nonceAction = credentials[1] ?? '';
    const serverAction = credentials[0] ?? '';

    let nonce = '';
    if (nonceAction) {
      try {
        const nd = await ajaxPost(new URLSearchParams({ action: nonceAction }).toString(), url);
        nonce = nd?.data ?? '';
      } catch {}
    }

    const servers = [];
    const byResolution = {};

    doc.querySelectorAll('.mirrorstream > ul').forEach(ul => {
      const qualityTitle = ul.querySelector('li')?.previousSibling?.text?.trim() ?? '';
      const resMatch = qualityTitle.match(/(\d{3,4})p/i);
      const resolution = resMatch ? resMatch[1] : '480';

      ul.querySelectorAll('li a[data-content]').forEach(a => {
        const raw = a.getAttribute('data-content') ?? '';
        const label = a.text.trim().toLowerCase();
        try {
          const decoded = JSON.parse(Buffer.from(raw, 'base64').toString());
          const enriched = { ...decoded, nonce, action: serverAction, referer: url };
          const serverId = Buffer.from(JSON.stringify(enriched), 'utf-8').toString('base64url');
          const serverObj = {
            title: qualityTitle ? `${resolution}p - ${label}` : label,
            serverId,
            resolution,
            provider: label,
            qualityNote: qualityTitle,
            priority: SERVER_PRIORITY[label] ?? 0,
          };
          servers.push(serverObj);
          if (!byResolution[resolution]) byResolution[resolution] = [];
          byResolution[resolution].push(serverObj);
        } catch {}
      });
    });

    Object.keys(byResolution).forEach(res => {
      byResolution[res].sort((a, b) => b.priority - a.priority);
    });

    let epTitle = doc.querySelector('.venutama h1.posttl')?.text?.trim() || episodeId;
    let prevEpisode = null, nextEpisode = null;

    doc.querySelectorAll('.flir a').forEach(a => {
      const title = a.text.trim();
      const href = a.getAttribute('href') ?? '';
      const epIdMatch = href.match(/\/episode\/([^/]+)\//);
      const epId = epIdMatch ? epIdMatch[1] : '';
      const obj = { title, episodeId: epId };
      if (title.toLowerCase().includes('prev') || title.toLowerCase().includes('sebelum')) prevEpisode = obj;
      else if (title.toLowerCase().includes('next') || title.toLowerCase().includes('berikut')) nextEpisode = obj;
    });

    let bestServerId = '';
    for (const res of ['480', '720', '360', '1080']) {
      const list = byResolution[res];
      if (list?.length > 0) { bestServerId = list[0].serverId; break; }
    }

    return { title: epTitle, servers, byResolution, defaultStreamingUrl, bestServerId, prevEpisode, nextEpisode };
  } catch (err) {
    console.error('scrapeServers error:', err?.message);
    return { title: episodeId, servers: [], byResolution: {}, defaultStreamingUrl: '', bestServerId: '', prevEpisode: null, nextEpisode: null };
  }
}

// ─── Resolve server ───────────────────────────────────────────────────────────
async function resolveServerId(serverId) {
  const decoded = JSON.parse(Buffer.from(serverId, 'base64url').toString('utf-8'));
  const { id, i, q, nonce, action, referer } = decoded;
  const body = new URLSearchParams({ id, i, q, nonce, action }).toString();
  const data = await ajaxPost(body, referer);

  let raw = data?.data ?? '';
  if (raw && !raw.startsWith('http') && !raw.startsWith('<')) {
    try { raw = Buffer.from(raw, 'base64').toString('utf-8'); } catch {}
  }

  let iframeUrl = '';
  if (raw.includes('<iframe')) {
    const match = raw.match(/src="([^"]+)"/);
    iframeUrl = match ? match[1] : '';
  } else {
    iframeUrl = raw;
  }
  return iframeUrl;
}

// ─── LK21 helpers ─────────────────────────────────────────────────────────────
const LK21_BASE = 'https://colliergop.org';
const LK21_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// HTTP fetch untuk LK21 (tidak perlu puppeteer)
async function lk21Fetch(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': LK21_UA, 'Referer': LK21_BASE + '/' },
    timeout: 20000,
  });
  return res.data;
}

async function lk21Post(path, data) {
  const res = await axios.post(`${LK21_BASE}${path}`, new URLSearchParams(data).toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': LK21_UA,
      'Referer': LK21_BASE + '/',
      'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 15000,
  });
  return res.data;
}

// Parser kartu film dari LK21
function parseLK21Cards(html) {
  const $ = parse(html, { parseNoneClosedTags: true });
  const seen = new Set();
  const movies = [];

  // Selector utama LK21
  $.querySelectorAll('article, .post, .item-infinite, .entry, .gmr-box-content').forEach(el => {
    const titleEl = el.querySelector('.entry-title a, h2 a, h3 a, .title a');
    let title = titleEl?.text?.trim() || '';
    let link = titleEl?.getAttribute('href') || '';

    // Fallback: cari link dari anchor apapun
    if (!title) {
      el.querySelectorAll('a').forEach(a => {
        const t = a.text.trim();
        if (t && t.length > 5 && !t.includes('HD') && !t.includes('Tonton') && !link) {
          title = t;
          link = a.getAttribute('href') || '';
        }
      });
    }

    const imgEl = el.querySelector('img');
    let image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
    if (image.includes('-60x90')) image = image.replace('-60x90', '-170x255');
    if (image.includes('-150x150')) image = image.replace('-150x150', '-170x255');

    // Ambil quality badge jika ada
    const qualityEl = el.querySelector('.gmr-quality-item, .quality, .Qlty');
    const quality = qualityEl?.text?.trim() || '';

    if (link && title && title.length > 3 && title !== 'HD' && !seen.has(link)
        && !link.includes('/quality/') && !link.includes('/category/') && !link.includes('/tag/')) {
      seen.add(link);
      movies.push({ title: title.replace(/&#\d+;/g, "'").replace(/\s+/g, ' '), url: link, image, quality });
    }
  });

  return movies;
}

// Decode server list dari halaman LK21
function parseLK21Servers(html) {
  const servers = [];

  // Cari semua tombol server (biasanya <li> dengan data-content base64 atau href langsung)
  const btnRegex = /<(?:li|a|button)[^>]*class="[^"]*(?:server|btn|mirrorstream)[^"]*"[^>]*(?:data-post="(\d+)"|data-server="([^"]+)"|href="([^"]+)")[^>]*>\s*([^<]*)</gi;
  let bm;
  while ((bm = btnRegex.exec(html)) !== null) {
    const label = (bm[4] || '').trim();
    const href = (bm[2] || bm[3] || '').trim();
    if (href && href.startsWith('http') && label && !servers.find(s => s.url === href)) {
      servers.push({ label: label || `Server ${servers.length + 1}`, url: href });
    }
  }

  // Fallback: cari iframe langsung di halaman
  if (servers.length === 0) {
    const ifM = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
    if (ifM) {
      let u = ifM[1];
      if (u.startsWith('//')) u = 'https:' + u;
      if (u.startsWith('http')) servers.push({ label: 'Server 1', url: u });
    }
  }

  return servers;
}

// Ambil Post ID dari halaman LK21
async function getLK21PostId(pageUrl) {
  const html = await lk21Fetch(pageUrl);
  const match = html.match(/<article[^>]*id="post-(\d+)"/i);
  if (match) return { postId: match[1], html };
  // Fallback cari di body class
  const bodyM = html.match(/class="[^"]*postid-(\d+)[^"]*"/i);
  if (bodyM) return { postId: bodyM[1], html };
  return { postId: '', html };
}

// Resolve embed URL dari LK21 lewat admin-ajax (3 server: p1, p2, p3)
async function getLK21EmbedUrl(postId, tab = 'p3') {
  try {
    const data = await lk21Post('/wp-admin/admin-ajax.php', {
      action: 'muvipro_player_content',
      tab,
      post_id: postId,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    const iframeM = html.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (iframeM) return iframeM[1];
    // Kadang langsung URL
    if (typeof data === 'string' && data.startsWith('http')) return data.trim();
  } catch {}
  return '';
}

// Kumpulkan semua server embed LK21 (p1..p5, deduplikasi URL)
async function getLK21Servers(postId) {
  const tabs = ['p1', 'p2', 'p3', 'p4', 'p5'];
  const results = await Promise.allSettled(tabs.map(t => getLK21EmbedUrl(postId, t)));
  const servers = [];
  const seenUrl = new Set();
  results.forEach((r, i) => {
    const url = r.status === 'fulfilled' ? r.value : '';
    if (url && url.startsWith('http') && !seenUrl.has(url)) {
      seenUrl.add(url);
      servers.push({ label: 'Server ' + (servers.length + 1), url, provider: detectProvider(url) });
    }
  });
  return servers;
}

// ─── RIJUNIME helpers (DEPRECATED - kept for compat) ─────────────────────────
const RINJU_BASE = 'https://rijunime.com'; // unused, kept for old refs
const RINJU_UA = LK21_UA;

// ─── Puppeteer browser pool ───────────────────────────────────────────────────
import { connect } from 'puppeteer-real-browser';

let _browser = null;
let _browserCreatedAt = 0;
let _browserLaunchPromise = null;
const BROWSER_TTL = 30 * 60 * 1000;

async function getRinjuBrowser() {
  const now = Date.now();

  if (_browser) {
    try {
      await _browser.pages();
      if (now - _browserCreatedAt > BROWSER_TTL) {
        console.log('[puppeteer] TTL reached, restarting browser...');
        await _browser.close().catch(() => {});
        _browser = null;
        _browserLaunchPromise = null;
      }
    } catch {
      console.log('[puppeteer] Browser dead, recreating...');
      _browser = null;
      _browserLaunchPromise = null;
    }
  }

  if (_browser) return _browser;

  if (_browserLaunchPromise) {
    await _browserLaunchPromise;
    return _browser;
  }

  _browserLaunchPromise = (async () => {
    console.log('[puppeteer] Launching browser...');
    const { browser } = await connect({
      headless: true,
      turnstile: true,
      disableXvfb: false,
      ignoreAllFlags: false,
      connectOption: { defaultViewport: null },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    _browser = browser;
    _browserCreatedAt = Date.now();
    console.log('[puppeteer] Browser ready');
  })();

  await _browserLaunchPromise;
  _browserLaunchPromise = null;
  return _browser;
}

// Semaphore biar ga buka terlalu banyak tab sekaligus
let _activePages = 0;
const MAX_PAGES = 3;

async function rinjuFetch(url, extraHeaders = {}, retries = 2) {
  // Tunggu kalau tab sudah penuh
  let waited = 0;
  while (_activePages >= MAX_PAGES) {
    await new Promise(r => setTimeout(r, 300));
    waited += 300;
    if (waited > 30000) throw new Error('rinjuFetch: timeout waiting for free page slot');
  }

  _activePages++;
  const browser = await getRinjuBrowser();
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      ...extraHeaders,
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Tunggu CF challenge selesai (max 20 detik)
    await page.waitForFunction(
      () => !document.title.includes('Just a moment') && !document.title.includes('Attention Required'),
      { timeout: 20000 }
    ).catch(() => {});

    // Extra tunggu kalau CF butuh waktu render
    await new Promise(r => setTimeout(r, 1500));

    const title = await page.title();
    const html = await page.content();

    // Kalau masih CF, retry
    if ((title.includes('Just a moment') || title.includes('Attention Required')) && retries > 0) {
      console.warn('[puppeteer] CF not solved yet, retrying...', retries);
      await page.close().catch(() => {});
      _activePages--;
      await new Promise(r => setTimeout(r, 3000));
      return rinjuFetch(url, extraHeaders, retries - 1);
    }

    console.log('[puppeteer] Fetched:', url.substring(0, 60), '| title:', title.substring(0, 40));
    return html;
  } finally {
    await page.close().catch(() => {});
    _activePages = Math.max(0, _activePages - 1);
  }
}

async function rinjuPost(endpoint, data) {
  // POST via puppeteer evaluate (fetch dari dalam browser, sudah punya CF cookie)
  const browser = await getRinjuBrowser();
  const page = await browser.newPage();
  try {
    // Buka halaman utama dulu supaya dapat CF clearance cookie
    const pages = await browser.pages();
    const hasMain = pages.some(p => p.url().includes('rijunime.com'));
    if (!hasMain) {
      await page.goto(RINJU_BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(
        () => !document.title.includes('Just a moment'),
        { timeout: 15000 }
      ).catch(() => {});
    }

    const postData = new URLSearchParams(data).toString();
    const result = await page.evaluate(async (endpoint, postData, base) => {
      const res = await fetch(base + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: postData,
      });
      return res.json();
    }, endpoint, postData, RINJU_BASE);

    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

function parseRinjuCards(html) {
  const $ = parse(html, { parseNoneClosedTags: true });
  const seen = new Set();
  const movies = [];

  $.querySelectorAll('.bsx').forEach(el => {
    const aEl = el.querySelector('a');
    const link = aEl?.getAttribute('href') || '';
    const title = el.querySelector('.tt h2, .tt, h2')?.text?.trim()
               || aEl?.getAttribute('title') || '';
    const imgEl = el.querySelector('img');
    let image = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src')
             || imgEl?.getAttribute('data-original') || imgEl?.getAttribute('src') || '';
    if (image.startsWith('data:')) image = '';
    const qualityEl = el.querySelector('.Qlty, .quality, .bt');
    const quality = qualityEl?.text?.trim() || '';
    if (link && title && title.length > 2 && !seen.has(link) && link.includes('rijunime.com')) {
      seen.add(link);
      movies.push({ title: title.replace(/\s+/g, ' '), url: link, image, quality });
    }
  });

  // Fallback selector
  if (movies.length === 0) {
    $.querySelectorAll('article.bs').forEach(el => {
      const aEl = el.querySelector('a');
      const link = aEl?.getAttribute('href') || '';
      const title = el.querySelector('h2, h3, .ntitle')?.text?.trim() || aEl?.getAttribute('title') || '';
      const imgEl = el.querySelector('img');
      let image = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src')
               || imgEl?.getAttribute('data-original') || imgEl?.getAttribute('src') || '';
      if (image.startsWith('data:')) image = '';
      const qualityEl = el.querySelector('.Qlty, .quality');
      const quality = qualityEl?.text?.trim() || '';
      if (link && title && title.length > 2 && !seen.has(link)) {
        seen.add(link);
        movies.push({ title: title.replace(/\s+/g, ' '), url: link, image, quality });
      }
    });
  }
  return movies;
}

function decodeRinjuServers(html) {
  const servers = [];
  const optRegex = /<option[^>]*value="([^"]+)"[^>]*>([^<]+)<\/option>/gi;
  let om;
  while ((om = optRegex.exec(html)) !== null) {
    const val = om[1].trim();
    const name = om[2].trim();
    if (!val || ['Select Video Server', 'Select Server', ''].includes(name)) continue;
    try {
      const decoded = Buffer.from(val, 'base64').toString('utf-8');
      const srcM = decoded.match(/src=["']([^"'\s]+)["']/i);
      let serverUrl = srcM ? srcM[1] : '';
      if (!serverUrl && val.startsWith('http')) serverUrl = val;
      if (!serverUrl && decoded.startsWith('http')) serverUrl = decoded.trim();
      if (serverUrl.startsWith('//')) serverUrl = 'https:' + serverUrl;
      if (serverUrl && serverUrl.startsWith('http')) {
        servers.push({ label: name, url: serverUrl });
      }
    } catch {
      if (val.startsWith('http')) servers.push({ label: name, url: val });
    }
  }
  // Fallback: ambil iframe src langsung
  if (servers.length === 0) {
    const ifM = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
    if (ifM) {
      let u = ifM[1];
      if (u.startsWith('//')) u = 'https:' + u;
      if (u.startsWith('http')) servers.push({ label: 'Server 1', url: u });
    }
  }
  return servers;
}

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json());

// ─── Banner video ─────────────────────────────────────────────────────────────
app.get('/banner.mp4', (req, res) => {
  const filePath = join(__dirname, 'banner.mp4');
  try {
    const stat = statSync(filePath);
    const range = req.headers['range'];
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
      createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
      createReadStream(filePath).pipe(res);
    }
  } catch { res.status(404).send('Not found'); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', indexReady, indexSize: otakuIndex.size }));

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });
    const db = loadDB();
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email sudah terdaftar' });
    if (db.users.find(u => u.username === username)) return res.status(400).json({ error: 'Username sudah dipakai' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), username, email, password: hashed, createdAt: Date.now() };
    const db2 = loadDB(); db2.users.push(user); saveDB(db2);
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, username, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: safeUser, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = loadDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Email tidak ditemukan' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Password salah' });
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, username: user.username, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: safeUser, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = loadDB();
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// ─── In-memory poster cache ────────────────────────────────────────────────────
const posterCache = new Map();
const POSTER_TTL = 7 * 24 * 60 * 60 * 1000;

async function getAnimeQuickInfo(url) {
  if (posterCache.has(url)) {
    const c = posterCache.get(url);
    if (Date.now() - c.cachedAt < POSTER_TTL) return c;
  }
  try {
    const html = await fetchHTML(url);
    const doc = parse(html, { parseNoneClosedTags: true });
    const poster = doc.querySelector('.fotoanime img, .thumb img, .animeinfo img')?.getAttribute('src') || '';
    const synopsis = doc.querySelector('.sinopc')?.text?.trim() || '';
    const result = { poster, synopsis, cachedAt: Date.now() };
    if (poster) posterCache.set(url, result);
    return result;
  } catch { return { poster: '', synopsis: '', cachedAt: Date.now() }; }
}

// ─── Jikan poster cache (fallback kalau OtakuDesu 403) ───────────────────────
const jikanPosterCache = new Map();

async function getJikanPoster(title) {
  if (jikanPosterCache.has(title)) return jikanPosterCache.get(title);
  try {
    const data = await jikanGet('/anime', { q: title, limit: '1', sfw: 'true' });
    const anime = data?.data?.[0];
    const poster = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url || '';
    if (poster) jikanPosterCache.set(title, poster);
    return poster;
  } catch { return ''; }
}

// ─── ANIME LIST ───────────────────────────────────────────────────────────────
app.get('/api/anime/list', (req, res) => {
  const { page = 1, limit = 24, q = '' } = req.query;
  let list = ANIME_LIST;
  if (q) list = list.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
  const start = (parseInt(page) - 1) * parseInt(limit);
  const results = list.slice(start, start + parseInt(limit));
  const withPosters = results.map(a => ({
    ...a,
    poster: posterCache.get(a.url)?.poster || a.poster || '',
  }));
  res.json({ results: withPosters, total: list.length, page: parseInt(page) });
});

app.post('/api/anime/posters', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls required' });

    const posters = {};
    const needJikan = [];

    urls.forEach(u => {
      const cached = posterCache.get(u)?.poster;
      if (cached) {
        posters[u] = cached;
      } else {
        const fromList = ANIME_LIST.find(a => a.url === u);
        if (fromList?.poster) {
          posters[u] = fromList.poster;
        } else {
          posters[u] = '';
          needJikan.push(u);
        }
      }
    });

    // Fallback ke Jikan untuk yang masih kosong
    if (needJikan.length > 0) {
      const chunks = [];
      for (let i = 0; i < needJikan.length; i += 3) chunks.push(needJikan.slice(i, i + 3));
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async u => {
          const fromList = ANIME_LIST.find(a => a.url === u);
          const title = fromList?.title || '';
          if (title) {
            const poster = await getJikanPoster(title);
            if (poster) {
              posters[u] = poster;
              posterCache.set(u, { poster, synopsis: '', cachedAt: Date.now() });
            }
          }
        }));
        await new Promise(r => setTimeout(r, 400));
      }
    }

    res.json({ posters });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ANIME SEARCH via Jikan ───────────────────────────────────────────────────
app.get('/api/anime/search', async (req, res) => {
  try {
    const { q, page = '1' } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    const data = await jikanGet('/anime', { q, page, limit: '20', sfw: 'true' });
    const results = (data?.data ?? []).map(a => ({
      title: a.title_english || a.title,
      titleJapanese: a.title_japanese || '',
      poster: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
      score: a.score,
      status: a.status || '',
      episodes: a.episodes ? String(a.episodes) : '?',
      malId: String(a.mal_id),
      url: '',
    }));
    res.json({ results, total: data?.pagination?.items?.total || results.length, page: parseInt(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ANIME DETAIL ─────────────────────────────────────────────────────────────
app.get('/api/anime/detail', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const slugMatch = url.match(/\/anime\/([^/]+)\//);
    const slug = slugMatch ? slugMatch[1] : '';

    const html = await fetchHTML(url);
    const doc = parse(html, { parseNoneClosedTags: true });

    const episodes = [];
    doc.querySelectorAll('.episodelist li a, .keyingpost li a').forEach(a => {
      const href = a.getAttribute('href') ?? '';
      const m = href.match(/\/episode\/([^/]+)\//);
      const epId = m ? m[1] : '';
      const epTitle = a.text.trim();
      if (epId) episodes.push({ title: epTitle, episodeId: epId, url: `${OTAKUDESU}/episode/${epId}/` });
    });

    const title = doc.querySelector('.entry-title, .jdlrx h1')?.text?.trim() || doc.querySelector('h1')?.text?.trim() || '';
    const poster = doc.querySelector('.fotoanime img, .thumb img')?.getAttribute('src') || '';
    const synopsis = doc.querySelector('.sinopc, .entry-content p')?.text?.trim() || '';

    const info = {};
    doc.querySelectorAll('.infozingle p').forEach(el => {
      const text = el.text;
      const parts = text.split(':');
      if (parts.length >= 2) info[parts[0].trim().toLowerCase().replace(/\s+/g, '_')] = parts.slice(1).join(':').trim();
    });

    res.json({ title, poster, synopsis, episodes: episodes.reverse(), info, slug });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── JIKAN search ─────────────────────────────────────────────────────────────
app.get('/api/jikan/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    for (const query of [q, q.replace(/\s+(season|part|s)\s*\d+/gi, '').trim(), q.replace(/[!?:]/g, '').trim()]) {
      if (!query) continue;
      const data = await jikanGet('/anime', { q: query, limit: '1', sfw: 'true' });
      if (data?.data?.[0]) return res.json({ data: data.data });
      await new Promise(r => setTimeout(r, 400));
    }
    res.json({ data: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/jikan/batch', async (req, res) => {
  try {
    const { titles } = req.query;
    if (!titles) return res.status(400).json({ error: 'titles required' });
    const titleList = decodeURIComponent(titles).split('|').slice(0, 20);
    const results = [];
    for (const title of titleList) {
      try {
        let jikan = null;
        for (const q of [title, title.replace(/\s+(season|part|s)\s*\d+/gi, '').trim()]) {
          if (!q) continue;
          const data = await jikanGet('/anime', { q, limit: '1', sfw: 'true' });
          if (data?.data?.[0]) { jikan = data.data[0]; break; }
          await new Promise(r => setTimeout(r, 400));
        }
        results.push({ title, jikan });
        await new Promise(r => setTimeout(r, 400));
      } catch { results.push({ title, jikan: null }); }
    }
    res.json({ results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── EPISODE ──────────────────────────────────────────────────────────────────
app.get('/api/episode/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const data = await scrapeServers(episodeId);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SERVER resolve ───────────────────────────────────────────────────────────
app.post('/api/server/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const url = await resolveServerId(serverId);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/server/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const url = await resolveServerId(serverId);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ANIME + EPISODE LIST via Jikan ──────────────────────────────────────────
app.get('/api/anime/jikan/:malId', async (req, res) => {
  try {
    const { malId } = req.params;
    const cacheKey = `jikan_${malId}`;
    if (slugCache.has(cacheKey)) return res.json(slugCache.get(cacheKey));

    const [detailRes, episodesRes] = await Promise.allSettled([
      jikanGet(`/anime/${malId}/full`),
      jikanGet(`/anime/${malId}/episodes`, { page: '1' }),
    ]);

    if (detailRes.status === 'rejected') return res.status(404).json({ error: 'Not found' });

    const anime = detailRes.value?.data;
    let rawEpisodes = episodesRes.status === 'fulfilled' ? episodesRes.value?.data ?? [] : [];

    const titleEn = anime.title_english || anime.title || '';
    const titleRomaji = anime.title || '';

    let slug = '';
    const cached = slugCache.get(`slug_${malId}`);
    if (cached) { slug = cached; }
    else {
      slug = await findOtakuSlug(titleEn, titleRomaji);
      if (slug) slugCache.set(`slug_${malId}`, slug);
    }

    let otakuEpMap = new Map();
    if (slug) otakuEpMap = await getEpMap(slug);

    const episodeList = rawEpisodes
      .sort((a, b) => b.mal_id - a.mal_id)
      .map(ep => {
        const epNum = ep.mal_id;
        const otakuId = otakuEpMap.get(epNum);
        if (!otakuId) return null;
        return {
          title: ep.title ? `Ep ${epNum}: ${ep.title}` : `Episode ${epNum}`,
          episodeId: otakuId,
          releaseDate: ep.aired ? ep.aired.split('T')[0] : '',
        };
      })
      .filter(Boolean);

    const result = {
      title: anime.title_english || anime.title,
      titleJapanese: anime.title_japanese || '',
      poster: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
      synopsis: anime.synopsis || '',
      score: anime.score,
      studio: anime.studios?.map(s => s.name).join(', ') || '',
      status: anime.status || '',
      episodes: anime.episodes ? String(anime.episodes) : '?',
      season: anime.season ? `${anime.season} ${anime.year}` : String(anime.year || ''),
      genres: (anime.genres || []).map(g => g.name),
      episodeList,
      otakuSlug: slug,
    };

    slugCache.set(cacheKey, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MUSIC ────────────────────────────────────────────────────────────────────
app.get('/api/music/trending', async (req, res) => {
  try {
    let items = [];
    try {
      const home = await muse.get_home();
      for (const section of home.sections ?? []) {
        for (const item of section.contents ?? []) {
          const s = mapSong(item);
          if (s?.videoId) items.push(s);
          if (items.length >= 24) break;
        }
        if (items.length >= 24) break;
      }
    } catch {}
    if (items.length === 0) {
      const fallback = await muse.search('top hits indonesia 2025', { filter: 'songs' });
      items = (fallback.categories?.[0]?.results ?? []).map(mapSong).filter(s => s?.videoId).slice(0, 24);
    }
    res.json({ results: items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/music/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    const results = await muse.search(q, { filter: 'songs' });
    const raw = results.categories?.[0]?.results ?? results.contents ?? [];
    res.json({ results: raw.map(mapSong).filter(s => s?.videoId).slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AI ───────────────────────────────────────────────────────────────────────
app.post('/api/ai/next-song', async (req, res) => {
  try {
    const { currentSong, currentArtist } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Based on the current song, suggest ONE song with same mood/theme. Reply ONLY with JSON: {"title":"Song Title","artist":"Artist Name","reason":"short reason in Indonesian max 10 words"}. No other text.' },
        { role: 'user', content: `Current: "${currentSong}" by ${currentArtist || 'Unknown'}. Suggest next song.` },
      ],
      max_tokens: 150, temperature: 0.8,
    });
    const text = completion.choices[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      const results = await muse.search(`${parsed.title} ${parsed.artist}`, { filter: 'songs' });
      const songs = (results.categories?.[0]?.results ?? []).map(mapSong).filter(s => s?.videoId);
      res.json({ recommendation: parsed, song: songs[0] || null });
    } catch { res.json({ recommendation: null, song: null }); }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: `Kamu asisten AI website ISAN (streaming anime & musik). Hanya jawab soal anime/musik. Bahasa Indonesia, singkat, max 3 paragraf. ${context ? `Konteks: ${context}` : ''}` },
        { role: 'user', content: message },
      ],
      max_tokens: 400, temperature: 0.7,
    });
    res.json({ reply: completion.choices[0]?.message?.content || 'Maaf, tidak bisa menjawab.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PLAYLIST ─────────────────────────────────────────────────────────────────
const PL_PATH = join(__dirname, 'playlists.json');
function loadPL() { if (!existsSync(PL_PATH)) return []; return JSON.parse(readFileSync(PL_PATH, 'utf-8')); }
function savePL(data) { writeFileSync(PL_PATH, JSON.stringify(data, null, 2)); }

app.get('/api/playlist', (req, res) => {
  res.json({ playlists: loadPL() });
});

app.get('/api/playlist/:id', (req, res) => {
  const pl = loadPL().find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json({ playlist: pl });
});

app.post('/api/playlist', (req, res) => {
  const { name, userId, username } = req.body;
  if (!name || !userId) return res.status(400).json({ error: 'name dan userId wajib' });
  const playlists = loadPL();
  const pl = { id: uuidv4(), name: name.trim(), userId, username: username || 'Anonim', songs: [], createdAt: Date.now() };
  playlists.push(pl);
  savePL(playlists);
  res.json({ playlist: pl });
});

app.patch('/api/playlist/:id', (req, res) => {
  const { name, userId } = req.body;
  if (!name || !userId) return res.status(400).json({ error: 'name dan userId wajib' });
  const playlists = loadPL();
  const pl = playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Tidak ditemukan' });
  if (pl.userId !== userId) return res.status(403).json({ error: 'Bukan milikmu' });
  pl.name = name.trim();
  savePL(playlists);
  res.json({ playlist: pl });
});

app.delete('/api/playlist/:id', (req, res) => {
  const { userId } = req.body;
  let playlists = loadPL();
  const pl = playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Tidak ditemukan' });
  if (pl.userId !== userId) return res.status(403).json({ error: 'Bukan milikmu' });
  savePL(playlists.filter(p => p.id !== req.params.id));
  res.json({ success: true });
});

app.post('/api/playlist/:id/songs', (req, res) => {
  const { song, userId } = req.body;
  if (!song) return res.status(400).json({ error: 'song required' });
  const playlists = loadPL();
  const pl = playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  if (pl.songs.find(s => s.videoId === song.videoId)) return res.status(400).json({ error: 'Lagu sudah ada di playlist' });
  pl.songs.push({ ...song, addedAt: Date.now(), addedBy: userId });
  savePL(playlists);
  res.json({ playlist: pl });
});

app.delete('/api/playlist/:id/songs/:songId', (req, res) => {
  const { userId } = req.body;
  const playlists = loadPL();
  const pl = playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  if (pl.userId !== userId) return res.status(403).json({ error: 'Bukan milikmu' });
  pl.songs = pl.songs.filter(s => s.videoId !== req.params.songId);
  savePL(playlists);
  res.json({ playlist: pl });
});

// ─── IMAGE PROXY (bypass hotlink protection) ─────────────────────────────────
app.get('/api/img-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('url required');
    const imgRes = await axios.get(url, {
      headers: { 'User-Agent': LK21_UA, Referer: LK21_BASE + '/' },
      responseType: 'arraybuffer',
      timeout: 15000,
      validateStatus: s => s < 500,
    });
    if (imgRes.status >= 400) return res.status(404).send('Image not found');
    res.set('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(imgRes.data));
  } catch (e) {
    console.error('[img-proxy] error:', e?.message);
    res.status(404).send('Image not found');
  }
});

// ─── MOVIE (LK21 / colliergop.org) ───────────────────────────────────────────
app.get('/api/movie/trending', async (req, res) => {
  try {
    const { page = '1' } = req.query;
    const url = page === '1'
      ? `${LK21_BASE}/genre/box-office/`
      : `${LK21_BASE}/genre/box-office/page/${page}/`;
    const html = await lk21Fetch(url);
    res.json({ results: parseLK21Cards(html), page: parseInt(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movie/latest', async (req, res) => {
  try {
    const { page = '1' } = req.query;
    const url = page === '1'
      ? `${LK21_BASE}/`
      : `${LK21_BASE}/page/${page}/`;
    const html = await lk21Fetch(url);
    res.json({ results: parseLK21Cards(html), page: parseInt(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movie/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    const url = `${LK21_BASE}/?s=${encodeURIComponent(q)}&post_type[]=post&post_type[]=tv`;
    const html = await lk21Fetch(url);
    const results = parseLK21Cards(html);
    res.json({ results });
  } catch (e) {
    console.error('[movie/search] error:', e?.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/movie/detail', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });

    const { postId, html } = await getLK21PostId(url);

    // ── Title ──────────────────────────────────────────────────────────────────
    let title = '';
    const h1M = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i)
             || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1M) title = h1M[1].replace(/&#\d+;/g, "'").trim();
    if (!title) {
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      if (ogTitle) title = ogTitle[1].replace(/\s*[-–|].*(?:lk21|nonton|download).*/i, '').trim();
    }

    // ── Image ──────────────────────────────────────────────────────────────────
    let image = '';
    const imgPostM = html.match(/<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/i);
    if (imgPostM) image = imgPostM[1];
    if (!image) {
      const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      if (ogImg) image = ogImg[1];
    }
    if (!image) {
      const srcsetM = html.match(/srcset="([^"]+170x255[^"]+)"/i);
      if (srcsetM) image = srcsetM[1].split(' ')[0];
    }
    if (image.includes('-60x90')) image = image.replace('-60x90', '-170x255');
    if (image.includes('-150x150')) image = image.replace('-150x150', '-170x255');

    // ── Synopsis ───────────────────────────────────────────────────────────────
    let synopsis = '';
    const blurayM = html.match(/Bluray\s*[–\-]\s*([^.<>]+(?:[^.<>]*\.?[^.<>]*))/i);
    if (blurayM) synopsis = blurayM[1].trim();
    if (!synopsis) {
      const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      if (metaDesc) synopsis = metaDesc[1].trim();
    }
    if (!synopsis) {
      const pM = html.match(/<p>([^<]{80,})<\/p>/i);
      if (pM) synopsis = pM[1].trim();
    }
    synopsis = synopsis
      .replace(/^Download\s+Streaming.*?(?:HD|Bluray)\s*[–\-]\s*/i, '')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
      .substring(0, 500);

    // ── Year ───────────────────────────────────────────────────────────────────
    let year = '';
    const yM = html.match(/Tahun:\s*(\d{4})/i);
    if (yM) year = yM[1];
    if (!year && title) { const yT = title.match(/\b(19|20)\d{2}\b/); if (yT) year = yT[0]; }

    // ── Genre ──────────────────────────────────────────────────────────────────
    const genres = [];
    const gRegex = /<a[^>]*href="[^"]*\/genre\/[^\/]+\/?[^"]*"[^>]*>([^<]+)<\/a>/gi;
    let gm;
    while ((gm = gRegex.exec(html)) !== null && genres.length < 6) {
      const g = gm[1].trim();
      if (g.length > 1 && !genres.includes(g) && !['Home', 'Beranda'].includes(g)) genres.push(g);
    }
    const genre = genres.join(', ') || html.match(/Genre:\s*([^<\n]+)/i)?.[1]?.trim() || '';

    // ── Quality ────────────────────────────────────────────────────────────────
    const qualM = html.match(/class="[^"]*(?:gmr-quality-item|Qlty|quality)[^"]*"[^>]*>([^<]+)</i);
    const quality = qualM ? qualM[1].trim() : '';

    // ── Episode list (untuk serial/TV) ─────────────────────────────────────────
    // LK21 (colliergop.org) URL pattern: /eps/<slug>-episode-N/
    const $doc = parse(html, { parseNoneClosedTags: true });
    const episodes = [];
    const seenEp = new Set();

    function extractEpNum(href, text) {
      text = text || '';
      return href.match(/episode[- _](\d+)/i)?.[1]
          || href.match(/\/eps\/[^\/]*?-(\d+)\/?$/i)?.[1]
          || href.match(/eps?-?(\d+)/i)?.[1]
          || text.match(/(?:episode|eps?)\s*(\d+)/i)?.[1]
          || text.match(/\b(\d+)\b/)?.[1]
          || '';
    }

    const epSelectors = [
      '.gmr-episode-item',
      '.episodelist li',
      '.eplister ul li',
      'ul.listeps li',
      '.eps-item',
      '.episode-item',
    ];

    for (const sel of epSelectors) {
      if (episodes.length > 0) break;
      $doc.querySelectorAll(sel).forEach(el => {
        const a = el.querySelector('a') || (el.tagName === 'A' ? el : null);
        const href = a?.getAttribute('href') || '';
        if (!href || !href.startsWith('http') || seenEp.has(href)) return;
        const numEl = el.querySelector('.epl-num, .epnum, .gmr-episode-number');
        const titleEl = el.querySelector('.epl-title, .eptitle, .gmr-episode-title');
        const rawText = a?.text?.trim() || el.text?.trim() || '';
        const epNum = numEl?.text?.trim() || extractEpNum(href, rawText);
        const epTitle = titleEl?.text?.trim() || rawText || ('Episode ' + epNum);
        if (epNum) {
          seenEp.add(href);
          episodes.push({ episode: epNum, title: epTitle, url: href });
        }
      });
    }

    // Fallback regex: /eps/ pattern LK21
    if (episodes.length === 0) {
      const epRegex = /<a[^>]*href="(https?:\/\/colliergop\.org\/eps\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
      let epM;
      while ((epM = epRegex.exec(html)) !== null) {
        const href = epM[1];
        const label = epM[2].trim();
        if (seenEp.has(href) || !label) continue;
        seenEp.add(href);
        const epNum = extractEpNum(href, label);
        if (epNum) episodes.push({ episode: epNum, title: label || ('Episode ' + epNum), url: href });
      }
    }

    // Fallback: /episode/ pattern lama
    if (episodes.length === 0) {
      const epRegex2 = /<a[^>]*href="(https?:\/\/colliergop\.org\/episode\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
      let epM;
      while ((epM = epRegex2.exec(html)) !== null) {
        const href = epM[1];
        const label = epM[2].trim();
        if (seenEp.has(href) || !label) continue;
        seenEp.add(href);
        const epNum = extractEpNum(href, label);
        if (epNum) episodes.push({ episode: epNum, title: label || ('Episode ' + epNum), url: href });
      }
    }

    episodes.sort((a, b) => {
      const na = parseFloat(a.episode), nb = parseFloat(b.episode);
      return isNaN(na) || isNaN(nb) ? a.episode.localeCompare(b.episode) : na - nb;
    });

    // ── Server list ────────────────────────────────────────────────────────────
    // Untuk film biasa: ambil 3 server via admin-ajax (p1/p2/p3)
    // Untuk serial: server ada di masing-masing halaman episode
    let servers = [];
    const isSerial = episodes.length > 0;

    if (!isSerial && postId) {
      servers = await getLK21Servers(postId);
    }

    // Fallback: decode dari HTML langsung (server yang embedded di halaman)
    if (servers.length === 0) {
      servers = parseLK21Servers(html);
    }

    res.json({
      title: title || 'Tidak diketahui',
      synopsis: synopsis || 'Sinopsis tidak tersedia',
      year: year || 'Tidak diketahui',
      genre,
      image,
      quality,
      url,
      postId,
      episodes,
      servers,
      isSerial,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MOVIE STREAM (LK21) ──────────────────────────────────────────────────────
// GET /api/movie/stream?url=<lk21_episode_or_movie_url>
// Mengembalikan server list beserta embed URL pertama (server 1)
app.get('/api/movie/stream', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });

    const { postId, html } = await getLK21PostId(url);
    if (!postId) return res.status(404).json({ error: 'Post ID tidak ditemukan' });

    // Ambil semua server (p1, p2, p3)
    const servers = await getLK21Servers(postId);
    if (servers.length === 0) return res.status(404).json({ error: 'Server tidak ditemukan' });

    const embedUrl = servers[0].url;
    res.json({ embedUrl, servers, provider: detectProvider(embedUrl), isDirect: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/movie/resolve — resolve embed URL (pass-through untuk LK21, embed URL sudah final)
app.post('/api/movie/resolve', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });
    // LK21 embed URL sudah langsung (iframe dari server eksternal), langsung return
    res.json({ embedUrl: url, provider: detectProvider(url), isDirect: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movie/resolve', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });
    res.json({ embedUrl: url, provider: detectProvider(url), isDirect: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Resolve embed URL: follow token redirect → extract real player URL ────────
// Flow: rijunime.com page → option value (base64) → rijunime.it.com?token=...
//       → redirect / HTML → filedon/mega/etc embed URL
async function resolveRinjuEmbed(rawTokenUrl) {
  console.log('[resolve] start:', rawTokenUrl.substring(0, 100));
  try {
    const browser = await getRinjuBrowser();
    const page = await browser.newPage();
    let finalUrl = rawTokenUrl;
    let html = '';

    try {
      await page.setExtraHTTPHeaders({ 'Referer': RINJU_BASE + '/' });
      await page.goto(rawTokenUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(
        () => !document.title.includes('Just a moment'),
        { timeout: 10000 }
      ).catch(() => {});
      finalUrl = page.url();
      html = await page.content();
    } finally {
      await page.close().catch(() => {});
    }

    // ── PRIORITY 1: __RIJUPLAYER__ config object ──────────────────────────────
    // Format: window.__RIJUPLAYER__ = { videoUrl: "...", realVideoUrl: "...", mediaType: "..." }
    const rijuCfg = html.match(/window\.__RIJUPLAYER__\s*=\s*\{([\s\S]*?)\}/);
    if (rijuCfg) {
      const block = rijuCfg[1];

      // Extract realVideoUrl dulu (lebih akurat), fallback ke videoUrl
      const realUrlM = block.match(/realVideoUrl\s*:\s*["']([^"']+)["']/);
      const videoUrlM = block.match(/videoUrl\s*:\s*["']([^"']+)["']/);
      const mediaTypeM = block.match(/mediaType\s*:\s*["']([^"']+)["']/);

      const embedUrl = (realUrlM?.[1] || videoUrlM?.[1] || '').trim();
      const mediaType = (mediaTypeM?.[1] || 'iframe').trim().toLowerCase();

      if (embedUrl && embedUrl.startsWith('http')) {
        console.log('[resolve] __RIJUPLAYER__ found:', embedUrl, '| type:', mediaType);

        // Kalau mediaType hls/mp4/webm → direct video
        const isDirect = ['hls', 'mp4', 'webm', 'm3u8'].includes(mediaType);
        return { embedUrl, provider: detectProvider(embedUrl), isDirect, mediaType };
      }
    }

    // ── PRIORITY 2: redirect ke URL eksternal langsung ────────────────────────
    if (!finalUrl.includes('rijunime.it.com') && finalUrl.startsWith('http')) {
      const isPage = html.includes('<html') || html.includes('<iframe') || html.includes('<video');
      if (!isPage) {
        console.log('[resolve] direct redirect:', finalUrl);
        return { embedUrl: finalUrl, provider: detectProvider(finalUrl) };
      }
    }

    // ── PRIORITY 3: iframe src ────────────────────────────────────────────────
    const iframeM = html.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (iframeM) {
      let u = iframeM[1];
      if (u.startsWith('//')) u = 'https:' + u;
      if (u.startsWith('http')) {
        console.log('[resolve] iframe src:', u);
        return { embedUrl: u, provider: detectProvider(u) };
      }
    }

    // ── PRIORITY 4: direct video URL (mp4/m3u8) ───────────────────────────────
    const videoM = html.match(/<source[^>]+src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i)
                || html.match(/["']file["']\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i)
                || html.match(/source\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (videoM) {
      console.log('[resolve] direct video:', videoM[1]);
      return { embedUrl: videoM[1], provider: 'direct', isDirect: true };
    }

    // ── PRIORITY 5: JS redirect ───────────────────────────────────────────────
    for (const pat of [
      /window\.location\.href\s*=\s*["']([^"']+)["']/i,
      /window\.location\s*=\s*["']([^"']+)["']/i,
      /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
      /location\.href\s*=\s*["']([^"']+)["']/i,
    ]) {
      const m = html.match(pat);
      if (m) {
        let u = m[1];
        if (u.startsWith('//')) u = 'https:' + u;
        if (u.startsWith('http')) {
          console.log('[resolve] JS redirect:', u);
          return { embedUrl: u, provider: detectProvider(u) };
        }
      }
    }

    // ── PRIORITY 6: meta refresh ──────────────────────────────────────────────
    const metaM = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i)
               || html.match(/content=["']\d+;\s*url=([^"']+)["']/i);
    if (metaM) {
      let u = metaM[1].trim();
      if (u.startsWith('//')) u = 'https:' + u;
      if (u.startsWith('http')) {
        console.log('[resolve] meta refresh:', u);
        return { embedUrl: u, provider: detectProvider(u) };
      }
    }

    // ── FALLBACK: finalUrl non-rijunime.it.com ────────────────────────────────
    if (!finalUrl.includes('rijunime.it.com')) {
      console.log('[resolve] fallback finalUrl:', finalUrl);
      return { embedUrl: finalUrl, provider: detectProvider(finalUrl) };
    }

    console.log('[resolve] nothing found, proxy fallback');
    const proxyUrl = `/api/movie/proxy-stream?url=${encodeURIComponent(rawTokenUrl)}`;
    return { embedUrl: proxyUrl, provider: 'proxy', isDirect: false };
  } catch (e) {
    console.error('[resolve] error:', e?.message);
    const proxyUrl = `/api/movie/proxy-stream?url=${encodeURIComponent(rawTokenUrl)}`;
    return { embedUrl: proxyUrl, provider: 'proxy', isDirect: false };
  }
}

function detectProvider(url) {
  if (!url) return 'unknown';
  if (url.includes('filedon')) return 'filedon';
  if (url.includes('mega.nz') || url.includes('mega.co')) return 'mega';
  if (url.includes('vidhide') || url.includes('vid.')) return 'vidhide';
  if (url.includes('zippyshare')) return 'zippyshare';
  if (url.includes('drive.google')) return 'gdrive';
  if (url.includes('streamtape')) return 'streamtape';
  if (url.includes('doodstream') || url.includes('dood.')) return 'doodstream';
  if (url.includes('mp4upload')) return 'mp4upload';
  return 'embed';
}

// (LK21 movie/stream + movie/resolve sudah didefinisikan di atas)

// GET proxy-stream — proxy HTML player, strip X-Frame-Options + strip ad/redirect scripts
app.get('/api/movie/proxy-stream', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });

    const playerRes = await axios.get(url, {
      headers: {
        'User-Agent': LK21_UA,
        'Referer': LK21_BASE + '/',
        'Origin': LK21_BASE,
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      timeout: 20000,
      responseType: 'arraybuffer',
      maxRedirects: 10,
    });

    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.set('Access-Control-Allow-Origin', '*');

    const contentType = playerRes.headers['content-type'] || 'text/html';

    if (contentType.includes('text/html')) {
      let html = Buffer.from(playerRes.data).toString('utf-8');

      // ── Strip script tag yang berisi ad/redirect keywords ──────────────────
      html = html.replace(
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        (match, body) => {
          const adKeywords = [
            'popunder', 'pop(', 'popad', 'popWin',
            'window.open',
            'adsbygoogle', 'googlesyndication',
            'juicyads', 'adcash', 'popcash', 'exoclick',
            'trafficjunky', 'propellerads', 'adsterra',
            'pushcrew', 'onesignal',
            // redirect patterns
            'document.addEventListener.*mousedown',
            'top.location', 'top.location.href',
            'parent.location',
          ];
          // Cek apakah script berisi keyword ad/redirect
          const isAd = adKeywords.some(kw => body.toLowerCase().includes(kw.toLowerCase()));
          // Cek mousedown/click global redirect (paling umum di player bajakan)
          const isMousedownRedirect = /document\.(addEventListener|on(mousedown|click))\s*[=(][\s\S]{0,300}(window\.open|location\s*[=.])/i.test(body);
          if (isAd || isMousedownRedirect) return '<!-- ad script removed -->';
          return match;
        }
      );

      // ── Strip meta refresh redirect ─────────────────────────────────────────
      html = html.replace(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/gi, '<!-- meta refresh removed -->');

      // ── Strip onclick/onmousedown attribute di seluruh elemen non-video ────
      html = html.replace(/(<(?!video|source)[a-z][^>]*?)\s+on(mousedown|click|mouseup)\s*=\s*["'][^"']*["']/gi, '$1');

      // ── Inject guard script sebelum </head> ─────────────────────────────────
      const guardScript = `<script>
(function() {
  // Block window.open (popup/popunder)
  var _open = window.open;
  window.open = function(url) {
    // Izinkan kalau dipanggil dari user interaction langsung pada video
    return null;
  };
  // Block top-level navigation dari dalam frame
  Object.defineProperty(window, 'top', { get: function() { return window; } });
  // Block mousedown redirect global (bukan pada elemen video/button player)
  document.addEventListener('mousedown', function(e) {
    var el = e.target;
    // Biarkan klik di area video, button, progress bar
    var allowed = ['VIDEO','BUTTON','INPUT','SELECT','OPTION','A'];
    if (!allowed.includes(el.tagName) && !el.closest('video,button,.vjs-control,.plyr')) {
      e.stopImmediatePropagation();
    }
  }, true);
})();
</script>`;

      if (html.includes('</head>')) {
        html = html.replace('</head>', guardScript + '</head>');
      } else if (html.includes('<body')) {
        html = html.replace(/<body[^>]*>/, m => m + guardScript);
      } else {
        html = guardScript + html;
      }

      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Bukan HTML (binary, dll) — pass-through
    res.set('Content-Type', contentType);
    if (playerRes.headers['content-length']) res.set('Content-Length', playerRes.headers['content-length']);
    res.send(Buffer.from(playerRes.data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Warm-up LK21: test koneksi ke colliergop.org ────────────────────────────
async function warmupLK21() {
  try {
    console.log('[lk21] Warming up colliergop.org...');
    const html = await lk21Fetch(`${LK21_BASE}/genre/box-office/`);
    const cards = parseLK21Cards(html);
    console.log('[lk21] Warmup done, got', cards.length, 'cards');
  } catch (e) {
    console.error('[lk21] Warmup failed:', e?.message);
  }
}

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ISAN] Backend http://localhost:${PORT}`);
  buildOtakuIndex().catch(console.error);
  warmupLK21().catch(console.error);
});
