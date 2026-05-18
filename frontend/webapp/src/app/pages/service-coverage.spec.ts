import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from '../core/services/auth.service';
import { FileService } from '../core/services/file.service';

describe('Service coverage (integration)', () => {
  let authService: AuthService;
  let fileService: FileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    fileService = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('couvre les appels principaux de AuthService', () => {
    authService.register('john@doe.fr', 'secret123').subscribe();
    let req = httpMock.expectOne('http://localhost:8080/api/register');
    expect(req.request.method).toBe('POST');
    req.flush(null);

    authService.login('john@doe.fr', 'secret123').subscribe((res) => {
      expect(res.token).toBe('jwt-login');
    });
    req = httpMock.expectOne('http://localhost:8080/api/login');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ token: 'jwt-login' });
    expect(authService.getToken()).toBe('jwt-login');
    expect(authService.hasToken()).toBeTrue();

    authService.refreshSession().subscribe((res) => {
      expect(res.token).toBe('jwt-refresh');
    });
    req = httpMock.expectOne('http://localhost:8080/api/refresh');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ token: 'jwt-refresh' });
    expect(authService.getToken()).toBe('jwt-refresh');

    authService.getMe().subscribe((user) => {
      expect(user.login).toBe('john@doe.fr');
    });
    req = httpMock.expectOne('http://localhost:8080/api/me');
    expect(req.request.method).toBe('GET');
    req.flush({ login: 'john@doe.fr' });

    (authService as any).setToken('jwt-session');
    authService.ensureAuthenticated().subscribe((isAuthenticated) => {
      expect(isAuthenticated).toBeTrue();
    });
    httpMock.expectNone('http://localhost:8080/api/refresh');

    (authService as any).setToken(null);
    authService.ensureAuthenticated().subscribe((isAuthenticated) => {
      expect(isAuthenticated).toBeFalse();
      expect(authService.getToken()).toBeNull();
    });
    req = httpMock.expectOne('http://localhost:8080/api/refresh');
    req.error(new ProgressEvent('error'));

    (authService as any).setToken('jwt-logout');
    authService.logout();
    req = httpMock.expectOne('http://localhost:8080/api/logout');
    expect(req.request.withCredentials).toBeTrue();
    req.error(new ProgressEvent('error'));
    expect(authService.getToken()).toBeNull();
  });

  it('couvre les appels principaux de FileService', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    fileService.uploadFile(file, ' secret ').subscribe((res) => {
      expect(res.storedFileName).toBe('stored.txt');
    });
    let req = httpMock.expectOne('http://localhost:8080/api/files');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('password')).toBe('secret');
    req.flush({ storedFileName: 'stored.txt', originalFileName: 'hello.txt', size: 5, contentType: 'text/plain' });

    fileService.listFiles().subscribe((files) => {
      expect(files.length).toBe(1);
      expect(files[0].storedFileName).toBe('stored.txt');
    });
    req = httpMock.expectOne('http://localhost:8080/api/files');
    expect(req.request.method).toBe('GET');
    req.flush({
      content: [
        {
          storedFileName: 'stored.txt',
          originalFileName: 'hello.txt',
          contentType: 'text/plain',
          size: 5,
          createdAt: '2026-04-11T00:00:00Z',
          passwordProtected: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    fileService.listHistory().subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('UPLOAD');
    });
    req = httpMock.expectOne('http://localhost:8080/api/files/history');
    req.flush({
      content: [
        {
          action: 'UPLOAD',
          storedFileName: 'stored.txt',
          originalFileName: 'hello.txt',
          occurredAt: '2026-04-13T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    fileService.downloadFile('file%20with%20spaces.pdf').subscribe((blob) => {
      expect(blob.size).toBe(2);
    });
    req = httpMock.expectOne('http://localhost:8080/api/files/file%2520with%2520spaces.pdf');
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['ok']));

    fileService.deleteFile('file%20with%20spaces.pdf').subscribe();
    req = httpMock.expectOne('http://localhost:8080/api/files/file%2520with%2520spaces.pdf');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    fileService.createShareLink('stored.txt', 3600).subscribe((share) => {
      expect(share.token).toBe('share-token');
    });
    req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/files/stored.txt/shares' && r.params.get('expiresInSeconds') === '3600');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'share-token', expiresAt: '2026-04-18T00:00:00Z', shareUrl: 'http://x/y', storedFileName: 'stored.txt' });

    fileService.downloadSharedFile('tok%20en', ' secret ').subscribe((blob) => {
      expect(blob.size).toBe(2);
    });
    req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/files/shared/tok%2520en' && r.params.get('password') === 'secret');
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['ok']));

    fileService.cacheUploadPreferences('stored.txt', true);
    expect(fileService.mergeWithCachedPreferences([
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
      },
    ])[0].passwordProtected).toBeTrue();

    fileService.clearCachedPreferences('stored.txt');
    expect(fileService.mergeWithCachedPreferences([
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
      },
    ])[0].passwordProtected).toBeFalse();

    const prefsBefore = localStorage.getItem('file_prefs_v1');
    fileService.cacheUploadPreferences('', true);
    expect(localStorage.getItem('file_prefs_v1')).toBe(prefsBefore);

    localStorage.setItem('file_prefs_v1', '{invalid json');
    expect(() =>
      fileService.mergeWithCachedPreferences([
        {
          storedFileName: 'stored.txt',
          originalFileName: 'hello.txt',
          contentType: 'text/plain',
          size: 5,
          createdAt: '2026-04-11T00:00:00Z',
        },
      ])
    ).not.toThrow();
  });
});


