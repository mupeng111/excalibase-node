// Excalibase Phase 1 probe: egress geo (dual source) + raw TCP reachability test.
const http = require('http');
const net = require('net');
const PORT = process.env.PORT || 8080;
async function egress() {
  const out = {};
  try { out.ipapi = await (await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,isp,query')).json(); } catch (e) { out.ipapi = String(e); }
  try { out.ipinfo = await (await fetch('https://ipinfo.io/json')).json(); } catch (e) { out.ipinfo = String(e); }
  return out;
}
function tcpTest(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = net.connect({ host, port });
    let bytes = 0; let firstDataMs = null;
    const done = (result) => { try { sock.destroy(); } catch {} resolve({ host, port, ...result, ms: Date.now() - started }); };
    sock.setTimeout(timeoutMs);
    sock.on('connect', () => { sock.write('GET / HTTP/1.0\r\n\r\n'); });
    sock.on('data', (d) => { bytes += d.length; if (firstDataMs === null) { firstDataMs = Date.now() - started; done({ connected: true, dataReceived: true, bytes, firstDataMs }); } });
    sock.on('timeout', () => done({ connected: bytes > 0 || !!sock._handle, dataReceived: bytes > 0, bytes, note: 'timeout' }));
    sock.on('error', (e) => done({ connected: false, dataReceived: false, error: String(e) }));
    sock.on('close', () => { if (bytes === 0) done({ connected: true, dataReceived: false, bytes: 0, note: 'closed-no-data' }); });
  });
}
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/egress') { res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify(await egress())); return; }
  if (u.pathname === '/tcp') {
    const host = u.searchParams.get('host') || 'nz.woairenqi.eu.cc';
    const port = parseInt(u.searchParams.get('port') || '11111', 10);
    res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify(await tcpTest(host, port))); return;
  }
  res.writeHead(200, {'content-type':'application/json'});
  res.end(JSON.stringify({ok:true, service:'excalibase-probe', port:PORT, mem:process.memoryUsage(), uptime:process.uptime()}));
});
srv.listen(PORT, '0.0.0.0', () => console.log('probe listening on', PORT));
