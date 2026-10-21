#!/usr/bin/env sh
# Puts the image of the panel in front of a fake API that echoes the Host header it receives, and checks that the
# address keeps its port. A browser sends "Origin: http://localhost:8081" with every POST; if the API saw
# "Host: localhost" instead, it would take the request for one from another site and refuse it (403).
#
# Usage: sh scripts/probar-proxy.sh [image]        (default image: biblioteca-web:ci)
set -eu

IMAGEN="${1:-biblioteca-web:ci}"
RED="proxy-prueba-$$"
PUERTO=18080

limpiar() {
  docker rm -f api-prueba web-prueba >/dev/null 2>&1 || true
  docker network rm "$RED" >/dev/null 2>&1 || true
}
trap limpiar EXIT

docker network create "$RED" >/dev/null

docker run -d --name api-prueba --network "$RED" --network-alias api python:3.13-alpine python -c "
from http.server import BaseHTTPRequestHandler, HTTPServer
class Eco(BaseHTTPRequestHandler):
    def responder(self):
        cuerpo = ('Host: ' + self.headers.get('Host', '')).encode()
        self.send_response(200)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)
    do_GET = responder
    do_POST = responder
HTTPServer(('0.0.0.0', 8080), Eco).serve_forever()
" >/dev/null

docker run -d --name web-prueba --network "$RED" -p "127.0.0.1:$PUERTO:8080" "$IMAGEN" >/dev/null

# Both containers take a moment to start: until the fake API answers, nginx answers 502 (or nothing). Wait for a real
# answer of the fake API, which always starts with "Host:", and only then judge it.
respuesta=""
for _ in $(seq 1 60); do
  respuesta="$(curl -s -m 2 -X POST -H "Origin: http://localhost:$PUERTO" "http://localhost:$PUERTO/api/v1/auth/login" || true)"
  case "$respuesta" in Host:*) break ;; esac
  sleep 1
done

esperado="Host: localhost:$PUERTO"
if [ "$respuesta" != "$esperado" ]; then
  echo "FAIL: the API would receive '$respuesta' and the panel was asked for '$esperado'" >&2
  exit 1
fi
echo "OK: the API receives '$respuesta'"
