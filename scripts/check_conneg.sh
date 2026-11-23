#!/usr/bin/env bash
# Checks how record IRIs and RDF downloads are served (website#19, docs/nginx/lod-am.conf).
#   scripts/check_conneg.sh                         # the live site
#   scripts/check_conneg.sh http://localhost:8080   # a local nginx
# Only reads (HEAD/GET); exits 1 if any check fails.
set -u
BASE="${1:-https://lod-am.net}"
REC="/id/find/8617989c-e99b-4e81-8b57-e707b8dc85c5"   # Awl (no. ARSL 14, Arslantepe), a released record
fail=0
hdr() { curl -s -o /dev/null -D - "$@" | tr -d '\r'; }
field() { grep -i "^$1:" | head -1 | cut -d' ' -f2- ; }
check() { # name, expected, actual
  if [ "$2" = "$3" ]; then echo "ok    $1: $3"; else echo "FAIL  $1: expected '$2', got '$3'"; fail=1; fi
}
negotiate() { # name, accept header, expected location suffix, expected content type of the target
  local h status loc ctype
  h=$(hdr -H "Accept: $2" "$BASE$REC")
  status=$(echo "$h" | grep '^HTTP/' | tail -1 | cut -d' ' -f2)
  loc=$(echo "$h" | field location)
  check "$1: status" "303" "$status"
  check "$1: Location" "$REC$3" "$loc"
  check "$1: Vary" "Accept" "$(echo "$h" | field vary)"
  ctype=$(hdr "$BASE$REC$3" | field content-type)
  check "$1: target type" "$4" "$ctype"
}
negotiate "browser" "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" "/" "text/html"
negotiate "no preference" "*/*" "/" "text/html"
negotiate "Turtle" "text/turtle" ".ttl" "text/turtle; charset=utf-8"
negotiate "Turtle, HTML as fallback" "text/turtle, text/html;q=0.5" ".ttl" "text/turtle; charset=utf-8"
negotiate "JSON-LD" "application/ld+json" ".jsonld" "application/ld+json; charset=utf-8"
# the Turtle actually describes the record
if curl -sL -H 'Accept: text/turtle' "$BASE$REC" | grep -q "$REC"; then echo "ok    Turtle names the record"; else echo "FAIL  Turtle doesn't name the record"; fail=1; fi
# documents keep working as before
check "HTML page" "200" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$REC/")"
check "dump type" "text/turtle; charset=utf-8" "$(hdr "$BASE/data/lod-am.ttl" | field content-type)"
check "VoID type" "text/turtle; charset=utf-8" "$(hdr "$BASE/data/void.ttl" | field content-type)"
check "CORS on Turtle" "*" "$(hdr "$BASE$REC.ttl" | field access-control-allow-origin)"
# an unknown record: redirected, then the site's 404
check "unknown record" "404" "$(curl -sL -o /dev/null -w '%{http_code}' "$BASE/id/find/00000000-0000-4000-8000-000000000000")"
# other redirects stay on the public address (no :8080)
loc=$(hdr "$BASE/data" | field location)
case "$loc" in *:8080*) check "directory redirect" "/data/" "$loc" ;; *) echo "ok    directory redirect: $loc" ;; esac
check ".git hidden" "404" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/.git/config")"
exit $fail
