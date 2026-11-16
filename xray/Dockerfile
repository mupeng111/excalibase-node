FROM alpine:3.20
RUN apk add --no-cache curl unzip ca-certificates caddy && \
    curl -fsSL -o /tmp/xray.zip https://github.com/XTLS/Xray-core/releases/download/v25.3.6/Xray-linux-64.zip && \
    mkdir -p /usr/local/xray && unzip -o /tmp/xray.zip -d /usr/local/xray && \
    chmod +x /usr/local/xray/xray && rm /tmp/xray.zip
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
CMD ["/entrypoint.sh"]
