#!/usr/bin/env bash
# Runs the staged JMeter load test headlessly and writes a results file plus an
# HTML dashboard report. Requires Apache JMeter 5.x and Java on the PATH.
#
# Usage:
#   ./run-load-test.sh [host] [port]
# Example:
#   ./run-load-test.sh localhost 4000

set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-4000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAN="${SCRIPT_DIR}/phoneme-builder-load-test.jmx"
RESULTS="${SCRIPT_DIR}/results.jtl"
REPORT_DIR="${SCRIPT_DIR}/report"

if ! command -v jmeter >/dev/null 2>&1; then
  echo "Apache JMeter was not found on the PATH." >&2
  echo "Install JMeter 5.x and Java 17+, then re-run this script." >&2
  exit 1
fi

# Remove stale output so -e -o can create a fresh report directory.
rm -rf "${REPORT_DIR}" "${RESULTS}"

jmeter -n \
  -t "${PLAN}" \
  -Jhost="${HOST}" \
  -Jport="${PORT}" \
  -l "${RESULTS}" \
  -e -o "${REPORT_DIR}"

echo "Load test complete."
echo "Raw results: ${RESULTS}"
echo "HTML report: ${REPORT_DIR}/index.html"
