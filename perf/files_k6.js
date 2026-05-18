import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const LOGIN = __ENV.LOGIN_USER || 'demo';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'demo123';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

function login() {
  const payload = JSON.stringify({ login: LOGIN, password: PASSWORD });
  const params = { headers: { 'Content-Type': 'application/json' }, timeout: '10s' };
  const res = http.post(`${BASE_URL}/api/login`, payload, params);
  check(res, {
    'login status 200': (r) => r.status === 200,
    'login token present': (r) => Boolean(r.json('token')),
  });
  return res.json('token');
}

export default function () {
  const token = login();
  const authHeaders = { Authorization: `Bearer ${token}` };

  const listRes = http.get(`${BASE_URL}/api/files?page=0&size=20`, {
    headers: authHeaders,
    timeout: '10s',
  });

  check(listRes, {
    'files list status 200': (r) => r.status === 200,
    'files list has content page': (r) => Array.isArray(r.json('content')),
  });

  const filePayload = {
    file: http.file('DataShare k6 sample\n', 'k6-sample.txt', 'text/plain'),
  };

  const uploadRes = http.post(`${BASE_URL}/api/files`, filePayload, {
    headers: authHeaders,
    timeout: '30s',
  });

  check(uploadRes, {
    'upload status 200': (r) => r.status === 200,
    'upload stored file present': (r) => Boolean(r.json('storedFileName')),
  });

  const storedFileName = uploadRes.json('storedFileName');
  if (storedFileName) {
    const downloadRes = http.get(`${BASE_URL}/api/files/${storedFileName}`, {
      headers: authHeaders,
      timeout: '30s',
    });
    check(downloadRes, {
      'download status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
