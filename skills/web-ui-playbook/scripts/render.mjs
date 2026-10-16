/**
 * web-ui-playbook — render.mjs (used by audit.mjs --render; zero dependencies)
 *
 * Opens a built page in the installed Chrome/Edge (headless), measures what the browser really shows, and
 * reads the results back with --dump-dom (works on Node 18; no DevTools protocol, no WebSocket):
 *   - text color vs. the real background behind it (after Alpine/Livewire/JS ran) in light and dark mode
 *   - horizontal overflow and headline line counts at 1440 / 768 / 375 px
 *   - fonts actually loaded, Persian text under 13 px, requests the page tried to send off the machine
 *
 * The page is served from a local server on 127.0.0.1 with a measuring script injected; Chrome is started
 * with every other host mapped to nowhere and a dead proxy, so nothing leaves the machine. Scripts get a
 * virtual-time budget, so Alpine x-data/:class and timers run before measuring.
 * Each run frames the page in an iframe of exactly width × height: headless Chrome never lays a window out
 * narrower than 500px, so a plain 375px window would really measure 500px. Headless --dump-dom also produces
 * no rendering frames, so three measurement shims are injected first: rAF runs on timers (Alpine x-show),
 * IntersectionObserver reports every element as visible (reveal-on-scroll, x-intersect), and transitions/
 * animations are off (elements show their end state). Only the state shown after load is measured.
 * No Chrome → { status: 'skipped' }: nothing is downloaded and nothing is counted as passed.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';

/** Installed Chromium-family browser, or null. CHROME_PATH=none opts out. Never downloads one. */
export function findChrome() {
  const env = process.env.CHROME_PATH;
  if (env === 'none') return null;
  if (env && fs.existsSync(env)) return env;
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const pf = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], 'C:\\Program Files', 'C:\\Program Files (x86)'].filter(Boolean);
  const list = process.platform === 'win32'
    ? [...pf.map((p) => path.join(p, 'Google', 'Chrome', 'Application', 'chrome.exe')), path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'), ...pf.map((p) => path.join(p, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
  for (const c of list) {
    if (path.isAbsolute(c)) { if (fs.existsSync(c)) return c; }
    else { const w = spawnSync('which', [c], { encoding: 'utf8' }); if (w.status === 0 && w.stdout.trim()) return w.stdout.trim(); }
  }
  return null;
}

// The measuring script injected into the page (runs after load + a delay, inside Chrome's virtual time).
// Pre-script, first thing in <head>: headless --dump-dom never produces rendering frames, so rAF callbacks (Alpine x-show)
// and IntersectionObserver (reveal-on-scroll, Alpine x-intersect) never fire. Measurement shims: rAF runs on timers, and
// every observed element is reported as intersecting — the page as a visitor sees it after scrolling through once.
// CSS transitions/animations don't advance without frames either, so they are switched off: elements show their end state.
const PRE = `<style id="__audit_static">*,*::before,*::after{transition:none!important;animation:none!important}html{scrollbar-width:none}</style><script>(function(){var q=new URLSearchParams(location.search);if(q.get('__audit_mode')==='dark')document.documentElement.classList.add('dark');
window.requestAnimationFrame=function(cb){return setTimeout(function(){cb(performance.now());},16);};window.cancelAnimationFrame=function(id){clearTimeout(id);};
window.IntersectionObserver=function(cb){var self=this;this.observe=function(el){setTimeout(function(){var r=el.getBoundingClientRect();cb([{target:el,isIntersecting:true,intersectionRatio:1,boundingClientRect:r,intersectionRect:r,rootBounds:null,time:performance.now()}],self);},50);};this.unobserve=function(){};this.disconnect=function(){};this.takeRecords=function(){return[];};};})();</script>`;
const PROBE = (waitMs) => `<script>(function(){
function rgba(c){var v=document.createElement('canvas');v.width=v.height=1;var x=v.getContext('2d');x.fillStyle='rgba(0,0,0,0)';x.fillStyle=c;x.clearRect(0,0,1,1);x.fillRect(0,0,1,1);var d=x.getImageData(0,0,1,1).data;return[d[0],d[1],d[2],d[3]/255];}
function over(a,b){var al=a[3]+b[3]*(1-a[3]);if(!al)return[0,0,0,0];return[0,1,2].map(function(i){return(a[i]*a[3]+b[i]*b[3]*(1-a[3]))/al}).concat(al);}
function lum(c){return[0,1,2].map(function(i){var v=c[i]/255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)}).reduce(function(s,v,i){return s+v*[0.2126,0.7152,0.0722][i]},0);}
function ratio(a,b){var x=lum(a),y=lum(b);return(Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
function hex(c){return'#'+c.slice(0,3).map(function(v){return Math.round(v).toString(16).padStart(2,'0')}).join('');}
function name(el){return el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).slice(0,3).join('.'):'');}
function measure(){
 var out={note:window.__note||null,texts:[],headlines:[],overflow:document.documentElement.scrollWidth-innerWidth,fonts:[],alpine:window.Alpine?(window.Alpine.version||'yes'):null,livewire:!!window.Livewire,external:[]};
 var page=rgba(getComputedStyle(document.documentElement).backgroundColor);if(page[3]<1)page=over(page,rgba(getComputedStyle(document.body).backgroundColor));if(page[3]<1)page=over(page,[255,255,255,1]);
 document.querySelectorAll('body *').forEach(function(el){
  if(el.closest('script,style,svg,noscript,template')||el.id==='__audit_result')return;
  var own='';el.childNodes.forEach(function(n){if(n.nodeType===3)own+=n.textContent;});own=own.replace(/\\s+/g,' ').trim();if(!own)return;
  var cs=getComputedStyle(el),r=el.getBoundingClientRect();
  var rec={text:own.slice(0,40),el:name(el),px:parseFloat(cs.fontSize),weight:parseInt(cs.fontWeight,10)||400,fa:/[\\u0600-\\u06FF]/.test(own)};
  if(!r.width||!r.height||cs.visibility==='hidden'||cs.display==='none'){rec.why='hidden';rec.msg='not visible (display:'+cs.display+')';out.texts.push(rec);return;}
  var op=1,n=el;while(n&&n.nodeType===1){op*=parseFloat(getComputedStyle(n).opacity);n=n.parentElement;}
  if(op<0.05){rec.why='hidden';out.texts.push(rec);return;}
  var fg=rgba(cs.color);if(fg[3]===0||cs.webkitTextFillColor==='transparent'||cs.color==='transparent'){rec.why='image';rec.msg='transparent text (gradient/clipped)';out.texts.push(rec);return;}
  var layers=[],bg=null;n=el;
  while(n&&n.nodeType===1){var s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none'){rec.why='image';rec.msg='background image/gradient on '+name(n);break;}var c=rgba(s.backgroundColor);if(c[3]>0){layers.push(c);if(c[3]>=1){bg=c;break;}}n=n.parentElement;}
  if(rec.why){out.texts.push(rec);return;}
  if(!bg)bg=page;for(var i=layers.length-1;i>=0;i--){if(layers[i]!==bg)bg=over(layers[i],bg);}
  var f=over([fg[0],fg[1],fg[2],fg[3]*op],bg);
  rec.ratio=ratio(f,bg);rec.fg=hex(f);rec.bg=hex(bg);rec.large=rec.px>=24||(rec.px>=18.66&&rec.weight>=700);out.texts.push(rec);
 });
 document.querySelectorAll('h1,h2').forEach(function(h){var cs=getComputedStyle(h),lh=cs.lineHeight==='normal'?parseFloat(cs.fontSize)*1.2:parseFloat(cs.lineHeight);var r=h.getBoundingClientRect();if(r.height)out.headlines.push({tag:h.tagName.toLowerCase(),text:h.textContent.trim().slice(0,40),lines:Math.round(r.height/lh),fa:/[\\u0600-\\u06FF]/.test(h.textContent)});});
 var fam=getComputedStyle(document.body).fontFamily.split(',')[0].replace(/["']/g,'').trim();
 document.fonts.forEach(function(f){if(f.status==='loaded')out.fonts.push(f.family.replace(/["']/g,'')+' '+f.weight);});
 out.bodyFont=fam;out.bodyFontLoaded=out.fonts.some(function(x){return x.indexOf(fam+' ')===0;});
 performance.getEntriesByType('resource').forEach(function(e){try{var u=new URL(e.name);if(u.hostname!=='127.0.0.1')out.external.push(u.host+u.pathname.slice(0,40));}catch(_){}});
 out.viewport=[innerWidth,innerHeight];var json=JSON.stringify(out).replace(/</g,'\\\\u003c');
 if(window.parent!==window){window.parent.postMessage({__audit:json},'*');return;}
 var s=document.createElement('script');s.type='application/json';s.id='__audit_result';s.textContent=json;document.body.appendChild(s);
}
// measure when the page is quiet: fonts loaded, then no DOM change for 1 s (Alpine/Livewire done), min waitMs, max 12 s
window.addEventListener('load',function(){var t0=Date.now(),last=Date.now(),done=false;
 new MutationObserver(function(){last=Date.now();}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});
 function finish(note){if(done)return;done=true;window.__note=note;measure();}
 function tick(){if(done)return;var now=Date.now();if(now-t0>12000){finish('timed out waiting for the page to settle');return;}
  if(now-t0>=${waitMs}&&now-last>=1000){var seen=last,fallback=setTimeout(function(){finish('no animation frames — rAF-driven updates (e.g. Alpine x-show) may be missing');},3000);
   requestAnimationFrame(function(){requestAnimationFrame(function(){clearTimeout(fallback);if(last===seen)finish(null);else setTimeout(tick,200);});});}
  else setTimeout(tick,200);}
 (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(tick,200);});});
})();</script>`;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

/** Serve `root` on 127.0.0.1 (random port); the page `pageRel` gets the probe injected. */
function serve(root, pageRel, waitMs) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname === '/__audit_frame.html') { // wrapper: frames the page at exactly w × h (its own viewport)
        const w = Number(u.searchParams.get('w')), h = Number(u.searchParams.get('h')), mode = u.searchParams.get('mode');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style><iframe width="${w}" height="${h}" src="/${pageRel}?__audit_mode=${mode}"></iframe><script>addEventListener('message',function(e){if(e.data&&e.data.__audit){var s=document.createElement('script');s.type='application/json';s.id='__audit_result';s.textContent=e.data.__audit;document.body.appendChild(s);}});</script>`);
        return;
      }
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      const file = path.resolve(root, rel || pageRel);
      if (!file.startsWith(path.resolve(root)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      let body = fs.readFileSync(file);
      if (path.resolve(file) === path.resolve(root, pageRel)) {
        const html = body.toString('utf8');
        const withPre = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + PRE) : PRE + html;
        body = Buffer.from(/<\/body>/i.test(withPre) ? withPre.replace(/<\/body>/i, `${PROBE(waitMs)}</body>`) : withPre + PROBE(waitMs));
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function dumpDom(chrome, url, width, height, dark) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wup-render-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, '--hide-scrollbars', '--virtual-time-budget=16000', '--run-all-compositor-stages-before-draw',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1',
    `--blink-settings=preferredColorScheme=${dark ? 0 : 1}`, '--dump-dom', url];
  return new Promise((resolve) => {
    const p = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => p.kill(), 90000);
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('close', () => { clearTimeout(timer); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* temp profile cleanup is best effort */ } resolve({ out, err }); });
    p.on('error', (e) => { clearTimeout(timer); resolve({ out: '', err: e.message }); });
  });
}

/**
 * @param htmlFile built page (.html) — Blade must be rendered first (save the HTML Laravel serves)
 * @param opts { root (folder the page's /assets resolve from; default: nearest "public" folder, else the page's folder), widths, modes, waitMs }
 */
export async function renderAudit(htmlFile, opts = {}) {
  const chrome = findChrome();
  if (!chrome) return { status: 'skipped', reason: 'no Chrome, Edge or Chromium found (set CHROME_PATH to use one; nothing is downloaded)', runs: [] };
  const abs = path.resolve(htmlFile);
  let root = opts.root ? path.resolve(opts.root) : null;
  if (!root) { let d = path.dirname(abs); while (d !== path.dirname(d) && path.basename(d) !== 'public') d = path.dirname(d); root = path.basename(d) === 'public' ? d : path.dirname(abs); }
  const pageRel = path.relative(root, abs).replace(/\\/g, '/');
  const server = await serve(root, pageRel, opts.waitMs ?? 1500);
  const port = server.address().port, runs = [];
  try {
    const widths = opts.widths || [1440, 768, 375], modes = opts.modes || ['light', 'dark'];
    for (const mode of modes) for (const width of widths) {
      if (mode === 'dark' && width !== widths[0]) continue; // colors: once per mode; layout: every width in light
      // the page is framed at exactly width × height: headless Chrome never lays a window out narrower than 500px
      const height = width < 768 ? 812 : 900;
      const { out, err } = await dumpDom(chrome, `http://127.0.0.1:${port}/__audit_frame.html?w=${width}&h=${height}&mode=${mode}`, Math.max(600, width + 40), height + 120, mode === 'dark');
      const m = out.match(/<script type="application\/json" id="__audit_result">([\s\S]*?)<\/script>/);
      if (!m) { runs.push({ width, mode, error: `no measurement came back (${(err || 'empty DOM').split('\n').filter(Boolean).slice(-1)[0] || 'timeout'})` }); continue; }
      runs.push({ width, mode, ...JSON.parse(m[1]) });
    }
  } finally { server.close(); }
  return { status: 'ok', browser: chrome, root, page: pageRel, runs };
}
