import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('uploadFile envoie un multipart/form-data', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    service.uploadFile(file).subscribe((response) => {
      expect(response.storedFileName).toBe('stored.txt');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({
      storedFileName: 'stored.txt',
      originalFileName: 'hello.txt',
      size: 5,
      contentType: 'text/plain',
    });
  });

  it('uploadFile envoie password quand renseigne', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    service.uploadFile(file, 'secret123').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/files');
    const body = req.request.body as FormData;
    expect(body.get('password')).toBe('secret123');
    req.flush({ storedFileName: 'stored.txt', originalFileName: 'hello.txt', size: 5, contentType: 'text/plain' });
  });

  it('createShareLink envoie expiresInSeconds quand fourni', () => {
    service.createShareLink('stored.txt', 3600).subscribe((res) => {
      expect(res.token).toBe('abc');
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/files/stored.txt/shares' && r.params.get('expiresInSeconds') === '3600'
    );

    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc', expiresAt: '2026-04-11T20:00:00Z', shareUrl: 'http://x/y', storedFileName: 'stored.txt' });
  });

  it('downloadSharedFile envoie password quand renseigne', () => {
    service.downloadSharedFile('token-123', ' secret ').subscribe((blob) => {
      expect(blob.size).toBe(2);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/files/shared/token-123' && r.params.get('password') === 'secret'
    );
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['ok']));
  });

  it('createShareLink n ajoute pas expiresInSeconds quand absent', () => {
    service.createShareLink('stored.txt').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/files/stored.txt/shares' && !r.params.has('expiresInSeconds')
    );

    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc', expiresAt: '2026-04-11T20:00:00Z', shareUrl: 'http://x/y', storedFileName: 'stored.txt' });
  });

  it('listFiles envoie une requete GET', () => {
    service.listFiles().subscribe((files) => {
      expect(files.length).toBe(1);
      expect(files[0].storedFileName).toBe('stored.txt');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files');
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
  });

  it('listHistory envoie une requete GET', () => {
    service.listHistory().subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('UPLOAD');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files/history');
    expect(req.request.method).toBe('GET');
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
  });

  it('deleteFile envoie une requete DELETE', () => {
    service.deleteFile('stored.txt').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/files/stored.txt');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('mergeWithCachedPreferences applique passwordProtected du cache local', () => {
    service.cacheUploadPreferences('stored.txt', true);

    const merged = service.mergeWithCachedPreferences([
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
      },
    ]);

    expect(merged[0].passwordProtected).toBeTrue();
    expect(merged[0].expiresAt).toBeUndefined();
  });

  it('mergeWithCachedPreferences laisse le fichier intact sans cache local', () => {
    const merged = service.mergeWithCachedPreferences([
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
      },
    ]);

    expect(merged[0].passwordProtected).toBeFalse();
    expect(merged[0].expiresAt).toBeUndefined();
  });

  it('clearCachedPreferences supprime l entree locale', () => {
    service.cacheUploadPreferences('stored.txt', true);
    service.clearCachedPreferences('stored.txt');

    const merged = service.mergeWithCachedPreferences([
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
      },
    ]);

    expect(merged[0].passwordProtected).toBeFalse();
    expect(merged[0].expiresAt).toBeUndefined();
  });

  // === PHASE 1: Edge cases ===

  it('encode les noms de fichiers avec caractères spéciaux', () => {
    service.downloadFile('file%20with%20spaces.pdf').subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/files/file%2520with%2520spaces.pdf'
    );
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['content']));
  });

  it('valide le format de la response pagination', () => {
    service.listFiles().subscribe((files) => {
      expect(files).toBeInstanceOf(Array);
      files.forEach((f) => {
        expect(f.storedFileName).toBeDefined();
        expect(f.originalFileName).toBeDefined();
        expect(f.contentType).toBeDefined();
        expect(f.size).toBeDefined();
      });
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files');
    req.flush({
      content: [
        {
          storedFileName: 'file.txt',
          originalFileName: 'file.txt',
          size: 100,
          contentType: 'text/plain',
          createdAt: '2026-05-10T00:00:00Z',
          passwordProtected: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });
  });

  it('gere les erreurs lors du cache des préférences', () => {
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');

    expect(() => {
      service.cacheUploadPreferences('file.txt', true);
    }).toThrowError('QuotaExceededError');
  });
});
