# Guide de migration vers `auth-core`

## Objectif

Reutiliser la logique JWT sans copier-coller entre projets backend.

## Ce que fournit `auth-core`

- `JwtProperties`
- `JwtService`
- auto-configuration Spring Boot

## Ce que l'application doit garder

- `UserDetailsService`
- `JwtAuthenticationFilter`
- `SecurityFilterChain`
- endpoints d'authentification (`/api/login`, `/api/register` selon ton besoin)

## Integration rapide dans un autre projet

1. Installer la lib localement:

```powershell
mvn -f backend-platform/auth-core/pom.xml clean install
```

2. Ajouter la dependance:

```xml
<dependency>
  <groupId>com.youssefdev</groupId>
  <artifactId>auth-core</artifactId>
  <version>1.0.0-SNAPSHOT</version>
</dependency>
```

3. Configurer `application.yml`:

```yaml
jwt:
  secret: "une-cle-secrete-longue"
  expiration-millis: 86400000
```

## Validation minimum

- [ ] Login retourne un token
- [ ] Endpoint protege refuse sans token
- [ ] Endpoint protege accepte avec token valide

