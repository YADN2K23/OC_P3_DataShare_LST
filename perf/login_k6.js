import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const LOGIN = __ENV.LOGIN_USER || 'demo';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'demo123';

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<600'],
  },
};

export default function () {
  const payload = JSON.stringify({
    login: LOGIN,
    password: PASSWORD,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  const res = http.post(`${BASE_URL}/api/login`, payload, params);

  check(res, {
    'status 200': (r) => r.status === 200,
    'token present': (r) => {
      try {
        const body = r.json();
        return body && typeof body.token === 'string' && body.token.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}

