import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('register envoie une requete POST', () => {
    service.register('john@doe.fr', 'secret123').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'john@doe.fr', password: 'secret123' });
    req.flush(null);
  });

  it('login stocke le token', () => {
    service.login('john@doe.fr', 'secret123').subscribe((res) => {
      expect(res.token).toBe('jwt-token');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/login');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ token: 'jwt-token' });

    expect(service.getToken()).toBe('jwt-token');
    expect(service.hasToken()).toBeTrue();
  });

  it('refreshSession renvoie un nouveau token avec credentials', () => {
    service.refreshSession().subscribe((res) => {
      expect(res.token).toBe('jwt-token');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/refresh');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ token: 'jwt-token' });

    expect(service.getToken()).toBe('jwt-token');
    expect(service.hasToken()).toBeTrue();
  });

  it('ensureAuthenticated tente un refresh si aucun access token', (done) => {
    service.ensureAuthenticated().subscribe((isAuthenticated) => {
      expect(isAuthenticated).toBeTrue();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/refresh');
    req.flush({ token: 'jwt-token' });
  });

  it('logout envoie une requete POST et purge le token', () => {
    (service as any).setToken('jwt-token');

    service.logout();

    const req = httpMock.expectOne('http://localhost:8080/api/logout');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);

    expect(service.getToken()).toBeNull();
    expect(service.hasToken()).toBeFalse();
  });

  it('getMe envoie une requete GET', () => {
    service.getMe().subscribe((user) => {
      expect(user.login).toBe('john@doe.fr');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/me');
    expect(req.request.method).toBe('GET');
    req.flush({ login: 'john@doe.fr' });
  });
});

