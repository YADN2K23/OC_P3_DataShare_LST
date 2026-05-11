# Guide d'Amélioration de la Couverture de Tests

## Vue d'ensemble
Couverture actuelle : **62.37% (Functions)**  
Objectif : **70%+**  
Gap : **7.63pp**

## Fichiers Prioritaires à Améliorer

### 1. Services Edge Cases

#### auth.service.ts
**Couverture actuelle**: 86%

Tests manquants:
```typescript
// À ajouter dans auth.service.spec.ts

it('gere les erreurs de réseau lors du login', () => {
  httpClient.post = jasmine.createSpy('post')
    .and.returnValue(throwError(() => new Error('Network error')));
  
  service.login('user@test.com', 'pass').subscribe({
    error: (err) => expect(err.message).toBe('Network error')
  });
});

it('cleare le token en cas d\'erreur refresh', () => {
  service.refreshSession().subscribe({ 
    error: () => expect(service.getToken()).toBeNull()
  });
  
  const req = httpMock.expectOne('http://localhost:8080/api/refresh');
  req.error(new ProgressEvent('error'));
});

it('gere les reponses invalides du serveur', () => {
  service.login('user@test.com', 'pass').subscribe({
    error: (err) => expect(err).toBeDefined()
  });
  
  const req = httpMock.expectOne('http://localhost:8080/api/login');
  req.flush({}, { status: 500, statusText: 'Server Error' });
});
```

#### file.service.ts
**Couverture actuelle**: 85%

Tests manquants:
```typescript
// À ajouter dans file.service.spec.ts

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
    files.forEach(f => {
      expect(f.storedFileName).toBeDefined();
      expect(f.originalFileName).toBeDefined();
    });
  });
  
  const req = httpMock.expectOne('http://localhost:8080/api/files');
  req.flush({
    content: [{
      storedFileName: 'file.txt',
      originalFileName: 'file.txt',
      size: 100,
      contentType: 'text/plain',
      createdAt: '2026-05-10T00:00:00Z'
    }],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20
  });
});

it('gere les erreurs lors du cache des préférences', () => {
  spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
  
  expect(() => {
    service.cacheUploadPreferences('file.txt', true);
  }).toThrow();
});
```

### 2. Composants Edge Cases

#### my-space.ts
**Manque**: Tests des branches d'erreur détaillées

Ajouter à `my-space.spec.ts`:
```typescript
it('rafraichit l\'historique après suppression', () => {
  authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
  fileService.deleteFile.and.returnValue(of(void 0));
  
  const fixture = TestBed.createComponent(MySpace);
  const component = fixture.componentInstance;
  
  // First load
  fixture.detectChanges();
  expect(fileService.listHistory).toHaveBeenCalledTimes(1);
  
  // Delete file
  component.onDeleteFile('file.txt');
  expect(fileService.listHistory).toHaveBeenCalledTimes(2);
});

it('affiche un message en cas d\'erreur globale', () => {
  authService.getMe.and.returnValue(throwError(() => 
    new HttpErrorResponse({ status: 503 })
  ));
  
  const fixture = TestBed.createComponent(MySpace);
  fixture.detectChanges();
  
  expect(fixture.componentInstance.filesError).toContain('session');
});

it('gere les fichiers avec noms de fichiers longs', () => {
  const longName = 'a'.repeat(255) + '.pdf';
  const mockFile = {
    storedFileName: longName,
    originalFileName: longName,
    contentType: 'application/pdf',
    size: 1000,
    createdAt: '2026-05-10T00:00:00Z'
  };
  
  authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
  fileService.listFiles.and.returnValue(of([mockFile] as any));
  
  const fixture = TestBed.createComponent(MySpace);
  fixture.detectChanges();
  
  expect(fixture.componentInstance.files[0].originalFileName).toBe(longName);
});
```

#### upload.ts
**Manque**: Tests pour annulation et retry

Ajouter à `upload.spec.ts`:
```typescript
it('nettoie le fichier sélectionné si l\'event est vide', () => {
  const fixture = TestBed.createComponent(Upload);
  const component = fixture.componentInstance;
  component.selectedFile = new File(['test'], 'test.txt');
  
  component.onFileSelected({ target: { files: [] } });
  
  expect(component.selectedFile).toBeNull();
});

it('gere les très gros fichiers avec progression', () => {
  const fixture = TestBed.createComponent(Upload);
  const component = fixture.componentInstance;
  const file = new File(
    [new ArrayBuffer(1024 * 1024 * 900)], // 900MB near limit
    'huge.bin',
    { type: 'application/octet-stream' }
  );
  
  // Doit être accepté (moins de 1GB)
  component.onFileSelected({ target: { files: [file] } });
  expect(component.selectedFile).toBe(file);
  expect(component.error).toBe('');
});

it('affiche la progression d\'upload', () => {
  // TODO: Ajouter des tests avec progressEvent quand implémenté
});
```

#### login.ts & register.ts
**Manque**: Tests pour les cas de validation

Ajouter à `login.spec.ts`:
```typescript
it('valide le format email', () => {
  const fixture = TestBed.createComponent(Login);
  const component = fixture.componentInstance;
  
  component.email = 'not-an-email';
  component.password = 'password123';
  component.onLogin();
  
  // Actuellement pas de validation email, mais À faire
});

it('gere les espacés dans les credentials', () => {
  authService.login.and.returnValue(of({ token: 'jwt' }));
  
  const fixture = TestBed.createComponent(Login);
  const component = fixture.componentInstance;
  component.email = '  user@test.com  ';
  component.password = '  password123  ';
  
  component.onLogin();
  
  // Devrait trimmer les valeurs
  expect(authService.login).toHaveBeenCalledWith('user@test.com', 'password123');
});
```

### 3. Cas de test supplémentaires recommandés

#### Tests de sécurité
```typescript
// À ajouter dans un nouveau fichier: security.spec.ts

it('empêche XSS dans les noms de fichiers', () => {
  const xssPayload = '<script>alert("xss")</script>.pdf';
  // Vérifier que le système échappe les noms de fichiers
});

it('valide les tokens JWT format', () => {
  // Vérifier que les tokens malformés sont rejetés
});

it('les requêtes sensibles utilisent withCredentials', () => {
  // Vérifier que les cookies sont disponibles pour CORS
});
```

#### Tests de performance
```typescript
// À ajouter: performance.spec.ts

it('gere les listes de fichiers largues (1000+ fichiers)', () => {
  const largeList = Array.from(
    { length: 1000 }, 
    (_, i) => ({
      storedFileName: `file${i}.pdf`,
      // ...properties
    })
  );
  
  service.mergeWithCachedPreferences(largeList).subscribe(result => {
    expect(result.length).toBe(1000);
  });
});

it('les filtres sont performants avec beaucoup de fichiers', () => {
  // Mesurer le temps de filtrage
  const start = performance.now();
  component.filteredFiles; // appel le getter
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100); // < 100ms
});
```

## Plan d'implémentation

### Phase 1 (1-2 jours)
Ajouter les edge cases Services:
- ❌ auth.service.spec.ts : +3 tests
- ❌ file.service.spec.ts : +3 tests
- **Objectif** : +6 tests → Couverture Functions: ~65%

### Phase 2 (2-3 jours)
Ajouter les edge cases Composants:
- ❌ my-space.spec.ts : +3 tests
- ❌ upload.spec.ts : +3 tests
- ❌ login/register.spec.ts : +2 tests
- **Objectif** : +8 tests → Couverture Functions: ~68%

### Phase 3 (1 jour)
Ajouter les tests crosscut (sécurité, perf):
- ❌ Nouveau: security.spec.ts : +3 tests
- ❌ Nouveau: performance.spec.ts : +2 tests
- **Objectif** : +5 tests → Couverture Functions: **70%+** ✅

## Commandes Utiles

```bash
# Générer rapport de couverture détaillé
npm run test:ci -- --code-coverage

# Voir couverture de fichier spécifique
npm run test:unit -- --code-coverage --include="**/auth.service.ts"

# Exécuter les tests en watch mode pendant développement
npm run test:unit -- --watch

# Exécuter un seul fichier de test
npm run test:unit -- --include="**/auth.service.spec.ts"

# Générer rapport HTML de couverture
npm run  test:ci
# Puis ouvrir: coverage/webapp/src/app/index.html
```

## Checkpoints de Qualité

- ✅ Tous les tests passent (`npm run test:ci`)
- ✅ Couverture ≥ 70%
- ✅ Pas de warnings TypeScript dans les tests
- ✅ Temps d'exécution < 5 minutes
- ✅ Pas de memory leaks (Zone.js cleanup)

## Notes Importantes

1. **Dates dans les tests**: Garder les dates relatives à la date courante (2026-05-10)
2. **Spy on Date.now()**: Utiliser pour contrôler les tests basés sur le temps
3. **afterEach cleanup**: Vérifier que localStorage/httpMock sont nettoyés
4. **Pas de fixture.debugElement**: Préférer `component` pour les tests logiques

---

**Auteur**: GitHub Copilot  
**Date**: 2026-05-10  
**Priorité**: 🔴 HAUTE - Requise pour version 1.0

