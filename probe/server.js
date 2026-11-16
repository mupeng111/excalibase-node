// Excalibase Phase 1 probe: reports container egress geo from inside.
const http = require('http');
const PORT = process.env.PORT || 8080;
async function egress() {
  const out = {};
  try { out.ipapi = await (await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,isp,query')).json(); } catch (e) { out.ipapi = String(e); }
  try { out.ipinfo = await (await fetch('https://ipinfo.io/json')).json(); } catch (e) { out.ipinfo = String(e); }
  return out;
}
const srv = http.createServer(async (req, res) => {
  if (req.url === '/egress') { res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify(await egress())); return; }
  res.writeHead(200, {'content-type':'application/json'});
  res.end(JSON.stringify({ok:true, service:'excalibase-probe', port:PORT, mem:process.memoryUsage(), uptime:process.uptime()}));
});
srv.listen(PORT, '0.0.0.0', () => console.log('probe listening on', PORT));
