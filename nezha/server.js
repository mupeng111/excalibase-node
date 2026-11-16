// Excalibase Nezha probe: HTTP health/status server on 8080 + supervised nezha-agent v2.
// Probe only — no proxy code. Agent reports outbound to the Nezha panel via NZ_* env vars
// (set in the platform panel, stored encrypted there; nothing secret in this image).
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const PORT = process.env.PORT || 8080;
const NZ_SERVER = process.env.NZ_SERVER || 'nz.woairenqi.eu.cc:11111';
const NZ_TLS = process.env.NZ_TLS || 'false';
const NZ_CLIENT_SECRET = process.env.NZ_CLIENT_SECRET || '';
const NZ_UUID = process.env.NZ_UUID || '';
const BOOT = new Date().toISOString();
const state = { agent: 'not-started', restarts: 0, startedAt: null, logTail: [] };
function log(msg) {
  const line = new Date().toISOString() + ' ' + msg;
  console.log(line);
  state.logTail.push(line);
  if (state.logTail.length > 40) state.logTail.shift();
}
function runAgent() {
  if (!NZ_CLIENT_SECRET || !NZ_UUID) { state.agent = 'disabled-no-config'; log('nezha: NZ_CLIENT_SECRET/NZ_UUID missing, agent disabled'); return; }
  if (!fs.existsSync('/app/nezha-agent')) { state.agent = 'missing-binary'; log('nezha: binary missing'); return; }
  state.agent = 'starting'; state.startedAt = new Date().toISOString();
  const env = Object.assign({}, process.env, {
    NZ_SERVER, NZ_TLS, NZ_CLIENT_SECRET, NZ_UUID,
    NZ_DISABLE_AUTO_UPDATE: 'true', NZ_DEBUG: 'true'
  });
  const child = spawn('/app/nezha-agent', [], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  state.agent = 'running';
  const onData = (d) => String(d).split('\n').filter(Boolean).forEach((l) => log('nezha: ' + l));
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (code, sig) => {
    state.restarts += 1;
    state.agent = 'exited';
    log('nezha: exited code=' + code + ' sig=' + sig + ', restart #' + state.restarts + ' in 5s');
    setTimeout(runAgent, 5000);
  });
  child.on('error', (e) => log('nezha: spawn error ' + e.message));
}
async function egress() {
  const out = {};
  try { out.ipapi = await (await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,isp,query')).json(); } catch (e) { out.ipapi = String(e); }
  try { out.ipinfo = await (await fetch('https://ipinfo.io/json')).json(); } catch (e) { out.ipinfo = String(e); }
  return out;
}
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  res.writeHead(200, { 'content-type': 'application/json' });
  if (u.pathname === '/egress') { res.end(JSON.stringify(await egress())); return; }
  if (u.pathname === '/status') {
    res.end(JSON.stringify({ service: 'excalibase-nezha', boot: BOOT, nzServer: NZ_SERVER, nzTls: NZ_TLS, nzUuid: NZ_UUID, agent: state.agent, restarts: state.restarts, startedAt: state.startedAt, uptime: process.uptime(), mem: process.memoryUsage(), logTail: state.logTail }));
    return;
  }
  res.end(JSON.stringify({ ok: true, service: 'excalibase-nezha', agent: state.agent }));
});
srv.listen(PORT, '0.0.0.0', () => { console.log('nezha probe http listening on', PORT); runAgent(); });
