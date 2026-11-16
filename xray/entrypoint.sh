#!/bin/sh
set -e
UUID="${UUID:-$(cat /proc/sys/kernel/random/uuid)}"
WSPATH="${WSPATH:-$(head -c 6 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
sed -i "s/WSPATH_PLACEHOLDER/$WSPATH/" /etc/caddy/Caddyfile
cat > /usr/local/xray/config.json <<EOJ
{"log":{"loglevel":"warning"},
 "inbounds":[{"listen":"127.0.0.1","port":10000,"protocol":"vless",
   "settings":{"clients":[{"id":"$UUID"}],"decryption":"none"},
   "streamSettings":{"network":"ws","wsSettings":{"path":"/$WSPATH"}}}],
 "outbounds":[{"protocol":"freedom"}]}
EOJ
echo "xray-node uuid=$UUID ws-path=/$WSPATH"
caddy start --config /etc/caddy/Caddyfile --adapter caddyfile
exec /usr/local/xray/xray run -c /usr/local/xray/config.json
