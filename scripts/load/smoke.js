// k6 smoke load test. Run: `pnpm load` (needs the k6 binary). Target: BASE_URL (default local dev API/SSR).
// Launch target (D19): 100 concurrent users, p95 < 500 ms, 0 % errors — T8.1 extends this script.

import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  for (const path of ['/', '/athletes', '/sports']) {
    const res = http.get(`${BASE_URL}${path}`);
    check(res, { [`${path} is 200`]: (r) => r.status === 200 });
  }
  sleep(1);
}
