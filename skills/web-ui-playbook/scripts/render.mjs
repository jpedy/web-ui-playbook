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
 * Targets: a built .html file · a build folder (out/, dist/, _site/ — clean URLs, opts.page picks the page) · a running
 * LOCAL server (http://localhost:3000/…, 127.0.0.1, [::1] only): the local audit server then works as a reverse proxy,
 * injects the probe into HTML responses (and drops their Content-Security-Policy so it can run) and passes everything
 * else through, so the page stays same-origin with the measuring frame. An unreachable target is { status: 'error' }.
 * Unresolved texts carry a reason code: gradient-or-image-bg · transparent-text (never counted as passed).
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
function pathOf(el){var p=[];while(el&&el.nodeType===1&&el!==document.body){var i=1,s=el;while((s=s.previousElementSibling))i++;p.unshift(el.tagName.toLowerCase()+':'+i);el=el.parentElement;}return p.join('>');}
function measure(){
 var out={note:window.__note||null,texts:[],headlines:[],overflow:document.documentElement.scrollWidth-innerWidth,fonts:[],alpine:window.Alpine?(window.Alpine.version||'yes'):null,livewire:!!window.Livewire,ssr:!!(document.getElementById('__NEXT_DATA__')||window.__next_f||window.__NUXT__||document.querySelector('astro-island,[data-sveltekit-hydrate],script[data-sveltekit-fetched]')),external:[]};
 var page=rgba(getComputedStyle(document.documentElement).backgroundColor);if(page[3]<1)page=over(page,rgba(getComputedStyle(document.body).backgroundColor));if(page[3]<1)page=over(page,[255,255,255,1]);
 document.querySelectorAll('body *').forEach(function(el){
  if(el.closest('script,style,svg,noscript,template')||el.id==='__audit_result')return;
  var own='';el.childNodes.forEach(function(n){if(n.nodeType===3)own+=n.textContent;});own=own.replace(/\\s+/g,' ').trim();if(!own)return;
  var cs=getComputedStyle(el),r=el.getBoundingClientRect();
  var rec={text:own.slice(0,40),el:name(el),path:pathOf(el),px:parseFloat(cs.fontSize),weight:parseInt(cs.fontWeight,10)||400,fa:/[\\u0600-\\u06FF]/.test(own)};
  if(!r.width||!r.height||cs.visibility==='hidden'||cs.display==='none'){rec.why='hidden';rec.msg='not visible (display:'+cs.display+')';out.texts.push(rec);return;}
  var op=1,n=el;while(n&&n.nodeType===1){op*=parseFloat(getComputedStyle(n).opacity);n=n.parentElement;}
  if(op<0.05){rec.why='hidden';out.texts.push(rec);return;}
  var fg=rgba(cs.color);if(fg[3]===0||cs.webkitTextFillColor==='transparent'||cs.color==='transparent'){rec.why='image';rec.reason='transparent-text';rec.msg='transparent text (gradient/clipped)';out.texts.push(rec);return;}
  var layers=[],bg=null;n=el;
  while(n&&n.nodeType===1){var s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none'){rec.why='image';rec.reason='gradient-or-image-bg';rec.msg='background image/gradient on '+name(n);break;}var c=rgba(s.backgroundColor);if(c[3]>0){layers.push(c);if(c[3]>=1){bg=c;break;}}n=n.parentElement;}
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
 // tap targets (controls, not links inside running text — WCAG 2.5.8 exempts those): size in CSS px
 out.targets=[];document.querySelectorAll('a[href],button,summary,select,input:not([type=hidden]),textarea,[role=button],[tabindex]:not([tabindex="-1"])').forEach(function(el){
  var r=el.getBoundingClientRect();if(r.width<=2||r.height<=2)return;var cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return;
  var p=el.parentElement,inline=false;if(el.tagName==='A'&&p){var t='';p.childNodes.forEach(function(n){if(n.nodeType===3)t+=n.textContent;});inline=/\\S{2,}/.test(t.replace(/\\s+/g,' '))&&cs.display==='inline';}
  if(!inline)out.targets.push({el:name(el),text:(el.textContent||el.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,30),w:Math.round(r.width),h:Math.round(r.height)});});
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

// The no-JS view: the page in an iframe sandboxed WITHOUT allow-scripts (its JavaScript never runs), measured from the
// wrapper. None of the measurement shims apply here; only CSS transitions/animations are switched off, so a pure-CSS
// animation cannot leave text stuck at its first frame (headless Chrome renders no frames).
const NOJS_WRAPPER = (w, h, src) => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style><iframe sandbox="allow-same-origin" width="${w}" height="${h}" src="${src}"></iframe><script>
var f=document.querySelector('iframe');
function name(el){return el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).slice(0,3).join('.'):'');}
f.addEventListener('load',function(){setTimeout(function(){
 var d=f.contentDocument,w=f.contentWindow,out={texts:[],empty:[],viewport:[d.documentElement.clientWidth,d.documentElement.clientHeight]};
 function pathOf(el){var p=[];while(el&&el.nodeType===1&&el!==d.body){var i=1,s=el;while((s=s.previousElementSibling))i++;p.unshift(el.tagName.toLowerCase()+':'+i);el=el.parentElement;}return p.join('>');}
 d.querySelectorAll('body *').forEach(function(el){
  if(el.closest('script,style,svg,template,noscript'))return;
  var own='';el.childNodes.forEach(function(n){if(n.nodeType===3)own+=n.textContent;});own=own.replace(/\\s+/g,' ').trim();if(!own)return;
  var cs=w.getComputedStyle(el),r=el.getBoundingClientRect(),op=1,n=el;while(n&&n.nodeType===1){op*=parseFloat(w.getComputedStyle(n).opacity);n=n.parentElement;}
  var why=cs.display==='none'?'display:none':cs.visibility==='hidden'?'visibility:hidden':op<0.05?'opacity '+op.toFixed(2):(!r.width||!r.height)?'zero size':null;
  out.texts.push({path:pathOf(el),text:own.slice(0,40),el:name(el),why:why});
 });
 d.querySelectorAll('[x-text],[x-html],[v-text],[v-html],[data-bind]').forEach(function(el){if(!el.textContent.trim()){var a=['x-text','x-html','v-text','v-html','data-bind'].find(function(k){return el.hasAttribute(k)});out.empty.push({el:name(el),why:a+'="'+el.getAttribute(a)+'" is empty until JavaScript runs'});}});
 d.querySelectorAll('template[x-for],template[x-if]').forEach(function(t){var a=t.hasAttribute('x-for')?'x-for':'x-if';out.empty.push({el:'template',why:a+'="'+t.getAttribute(a)+'" renders nothing without JavaScript'});});
 var s=document.createElement('script');s.type='application/json';s.id='__audit_result';s.textContent=JSON.stringify(out).replace(/</g,'\\\\u003c');document.body.appendChild(s);
},1500);});
</script>`;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

const STATIC_STYLE = '<style id="__audit_static">*,*::before,*::after{transition:none!important;animation:none!important}html{scrollbar-width:none}</style>';
const withParam = (p, k, v) => `${p}${p.includes('?') ? '&' : '?'}${k}=${v}`;
/** The page as the audit serves it: probe (with JS) or static CSS only (no-JS view). */
function inject(html, nojs, waitMs) {
  if (nojs) return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + STATIC_STYLE) : STATIC_STYLE + html;
  const withPre = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + PRE) : PRE + html;
  return /<\/body>/i.test(withPre) ? withPre.replace(/<\/body>/i, `${PROBE(waitMs)}</body>`) : withPre + PROBE(waitMs);
}
/** A file in a static folder: exact file, folder/index.html, or a clean URL (/about → about.html). */
function staticFile(root, rel) {
  const base = path.resolve(root, rel);
  if (!base.startsWith(path.resolve(root))) return null;
  for (const c of [base, path.join(base, 'index.html'), `${base}.html`]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

/**
 * Serve the target on 127.0.0.1 (random port). source = { kind: 'file', root, pageRel } | { kind: 'dir', root } |
 * { kind: 'url', origin }. HTML requested with __audit_mode gets the probe; with __audit_nojs the static CSS only.
 */
function serve(source, page, waitMs) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname === '/__audit_frame.html') { // wrapper: frames the page at exactly w × h (its own viewport)
        const w = Number(u.searchParams.get('w')), h = Number(u.searchParams.get('h')), mode = u.searchParams.get('mode');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style><iframe width="${w}" height="${h}" src="${withParam(page, '__audit_mode', mode)}"></iframe><script>addEventListener('message',function(e){if(e.data&&e.data.__audit){var s=document.createElement('script');s.type='application/json';s.id='__audit_result';s.textContent=e.data.__audit;document.body.appendChild(s);}});</script>`);
        return;
      }
      if (u.pathname === '/__audit_nojs.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(NOJS_WRAPPER(Number(u.searchParams.get('w')), Number(u.searchParams.get('h')), withParam(page, '__audit_nojs', '1')));
        return;
      }
      const nojs = u.searchParams.has('__audit_nojs'), probed = nojs || u.searchParams.has('__audit_mode');
      u.searchParams.delete('__audit_nojs'); u.searchParams.delete('__audit_mode');
      if (source.kind === 'url') return proxy(source.origin, req, res, u, probed, nojs, waitMs);
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      const file = source.kind === 'file' ? (rel ? staticFile(source.root, rel) : path.resolve(source.root, source.pageRel)) : staticFile(source.root, rel || '.');
      if (!file) { res.writeHead(404); res.end(); return; }
      let body = fs.readFileSync(file);
      if (probed && /\.html?$/i.test(file)) body = Buffer.from(inject(body.toString('utf8'), nojs, waitMs));
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** Reverse proxy to the user's local server; HTML pages under test get the probe. */
function proxy(origin, req, res, u, probed, nojs, waitMs) {
  const up = new URL(origin);
  const headers = { ...req.headers, host: up.host, 'accept-encoding': 'identity' };
  delete headers.referer; delete headers.origin;
  const r = http.request({ hostname: up.hostname, port: up.port || 80, path: u.pathname + u.search, method: req.method, headers }, (pr) => {
    const h = { ...pr.headers };
    if (h.location) { // keep redirects on the audit server, and keep the page under test
      let loc = h.location.startsWith(up.origin) ? h.location.slice(up.origin.length) || '/' : h.location;
      if (probed && loc.startsWith('/')) loc = withParam(loc, nojs ? '__audit_nojs' : '__audit_mode', nojs ? '1' : new URL(req.url, 'http://x').searchParams.get('__audit_mode'));
      h.location = loc;
    }
    if (probed && /text\/html/i.test(h['content-type'] || '')) {
      const chunks = [];
      pr.on('data', (c) => chunks.push(c));
      pr.on('end', () => {
        for (const k of ['content-length', 'content-encoding', 'etag', 'content-security-policy', 'content-security-policy-report-only']) delete h[k];
        h['cache-control'] = 'no-store';
        res.writeHead(pr.statusCode, h);
        res.end(inject(Buffer.concat(chunks).toString('utf8'), nojs, waitMs));
      });
      return;
    }
    res.writeHead(pr.statusCode, h);
    pr.pipe(res);
  });
  r.on('error', (e) => { res.writeHead(502); res.end(`audit proxy: ${e.message}`); });
  req.pipe(r);
}

/** GET a local URL → { ok, status, error } (before starting the browser). */
function reach(url) {
  return new Promise((resolve) => {
    const r = http.get(url, { headers: { 'accept-encoding': 'identity' }, timeout: 15000 }, (res) => { res.resume(); resolve({ ok: res.statusCode < 500, status: res.statusCode }); });
    r.on('timeout', () => r.destroy(new Error('no answer within 15 s')));
    r.on('error', (e) => resolve({ ok: false, error: e.message }));
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
 * @param target built page (.html) · build folder · local URL (http://localhost:3000/path) — Blade/PHP must be rendered
 *               first (save the HTML) or served (URL)
 * @param opts { root (file targets: folder the page's /assets resolve from; default: nearest "public" folder, else the
 *               page's folder), page (folder targets: path to render, default "/"), widths, modes, waitMs, nojs }
 */
export async function renderAudit(target, opts = {}) {
  const chrome = findChrome();
  if (!chrome) return { status: 'skipped', reason: 'no Chrome, Edge or Chromium found (set CHROME_PATH to use one; nothing is downloaded)', runs: [] };
  let source, page, root = null, pageRel;
  if (/^https?:\/\//i.test(target)) {
    const t = new URL(target);
    if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(t.hostname)) return { status: 'error', reason: `only local URLs can be rendered (localhost, 127.0.0.1, [::1]) — not ${t.hostname}`, runs: [] };
    if (t.protocol !== 'http:') return { status: 'error', reason: 'only http:// local servers are supported (start the dev/production server without TLS)', runs: [] };
    const origin = `http://${t.hostname === 'localhost' ? '127.0.0.1' : t.hostname}:${t.port || 80}`;
    const ok = await reach(origin + t.pathname + t.search);
    if (!ok.ok) return { status: 'error', reason: `${target} is not reachable (${ok.error || `HTTP ${ok.status}`}) — start the server first`, runs: [] };
    source = { kind: 'url', origin }; page = t.pathname + t.search; pageRel = page;
  } else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    root = path.resolve(target); page = opts.page || '/';
    if (!staticFile(root, page.replace(/^\/+/, '') || '.')) return { status: 'error', reason: `${page} not found in ${target}`, runs: [] };
    source = { kind: 'dir', root }; pageRel = page;
  } else {
    if (!fs.existsSync(target)) return { status: 'error', reason: `${target} not found`, runs: [] };
    const abs = path.resolve(target);
    root = opts.root ? path.resolve(opts.root) : null;
    if (!root) { let d = path.dirname(abs); while (d !== path.dirname(d) && path.basename(d) !== 'public') d = path.dirname(d); root = path.basename(d) === 'public' ? d : path.dirname(abs); }
    pageRel = path.relative(root, abs).replace(/\\/g, '/');
    source = { kind: 'file', root, pageRel }; page = `/${pageRel}`;
  }
  const server = await serve(source, page, opts.waitMs ?? 1500);
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
    // no-JS view at the first width: what a visitor sees when JavaScript fails or is blocked
    let nojs = null;
    if (opts.nojs !== false) {
      const width = widths[0], height = width < 768 ? 812 : 900;
      const { out, err } = await dumpDom(chrome, `http://127.0.0.1:${port}/__audit_nojs.html?w=${width}&h=${height}`, Math.max(600, width + 40), height + 120, false);
      const m = out.match(/<script type="application\/json" id="__audit_result">([\s\S]*?)<\/script>/);
      if (!m) nojs = { width, error: `no measurement came back (${(err || 'empty DOM').split('\n').filter(Boolean).slice(-1)[0] || 'timeout'})` };
      else {
        const r = JSON.parse(m[1]);
        const withJs = runs.find((x) => x.mode === 'light' && x.width === width && x.texts);
        const visibleWithJs = new Set((withJs?.texts || []).filter((t) => t.why !== 'hidden').map((t) => t.path));
        nojs = { width, viewport: r.viewport, checked: r.texts.length,
          hidden: r.texts.filter((t) => t.why && visibleWithJs.has(t.path)), // visible with JS, hidden without it
          empty: r.empty };
      }
    }
    return { status: 'ok', browser: chrome, root, kind: source.kind, page: pageRel, runs, nojs };
  } finally { server.close(); }
}
