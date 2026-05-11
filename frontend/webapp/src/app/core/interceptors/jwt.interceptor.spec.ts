import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

describe('JwtInterceptor', () => {
  it('ajoute le header Authorization quand le token existe', () => {
    const authService = { getToken: () => 'jwt-123' } as AuthService;
    const interceptor = new JwtInterceptor(authService);

    const req = new HttpRequest('GET', '/api/me');
    const next: HttpHandler = {
      handle: (request) => {
        expect(request.headers.get('Authorization')).toBe('Bearer jwt-123');
        return of({} as any);
      },
    };

    interceptor.intercept(req, next).subscribe();
  });

  it('n ajoute pas Authorization si aucun token', () => {
    const authService = { getToken: () => null } as AuthService;
    const interceptor = new JwtInterceptor(authService);

    const req = new HttpRequest('GET', '/api/me');
    const next: HttpHandler = {
      handle: (request) => {
        expect(request.headers.has('Authorization')).toBeFalse();
        return of({} as any);
      },
    };

    interceptor.intercept(req, next).subscribe();
  });

  it('retente la requete apres refresh en cas de 401', (done) => {
    let attempt = 0;
    const authService = {
      getToken: () => (attempt === 0 ? 'expired-token' : 'fresh-token'),
      refreshSession: () => of({ token: 'fresh-token' }),
      logout: () => undefined,
    } as AuthService;
    const interceptor = new JwtInterceptor(authService);

    const req = new HttpRequest('GET', '/api/me');
    const next: HttpHandler = {
      handle: (request) => {
        attempt += 1;

        if (attempt === 1) {
          expect(request.headers.get('Authorization')).toBe('Bearer expired-token');
          return throwError(() => new HttpErrorResponse({ status: 401 }));
        }

        expect(request.headers.get('Authorization')).toBe('Bearer fresh-token');
        return of({} as any);
      },
    };

    interceptor.intercept(req, next).subscribe({
      complete: () => {
        expect(attempt).toBe(2);
        done();
      },
      error: () => fail('la requete aurait du etre rejouee apres refresh'),
    });
  });
});

