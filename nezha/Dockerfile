FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl unzip ca-certificates && \
    curl -fsSL -o /tmp/agent.zip https://github.com/nezhahq/agent/releases/download/v2.3.5/nezha-agent_linux_amd64.zip && \
    unzip -o /tmp/agent.zip -d /tmp/agent && \
    mv /tmp/agent/nezha-agent /app/nezha-agent && chmod +x /app/nezha-agent && \
    rm -rf /tmp/agent.zip /tmp/agent
COPY server.js .
EXPOSE 8080
CMD ["node","server.js"]
