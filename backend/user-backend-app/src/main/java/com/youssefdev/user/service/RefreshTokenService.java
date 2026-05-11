package com.youssefdev.user.service;

import com.youssefdev.user.entity.AppUserEntity;
import com.youssefdev.user.entity.RefreshTokenEntity;
import com.youssefdev.user.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(30);

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String issue(AppUserEntity user) {
        String rawToken = generateRawToken();
        refreshTokenRepository.save(createEntity(user, rawToken));
        return rawToken;
    }

    @Transactional
    public RotatedRefreshToken rotate(String rawToken) {
        RefreshTokenEntity existing = findActiveToken(rawToken);
        existing.setRevokedAt(Instant.now());
        existing.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(existing);

        String newRawToken = generateRawToken();
        refreshTokenRepository.save(createEntity(existing.getUser(), newRawToken));
        return new RotatedRefreshToken(existing.getUser(), newRawToken);
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        RefreshTokenEntity existing = findActiveToken(rawToken);
        existing.setRevokedAt(Instant.now());
        existing.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(existing);
    }

    private RefreshTokenEntity findActiveToken(String rawToken) {
        String tokenHash = hash(rawToken);
        RefreshTokenEntity refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Refresh token invalide ou expiré."));

        Instant now = Instant.now();
        if (refreshToken.getRevokedAt() != null || refreshToken.getExpiresAt().isBefore(now)) {
            throw new BadCredentialsException("Refresh token invalide ou expiré.");
        }

        return refreshToken;
    }

    private RefreshTokenEntity createEntity(AppUserEntity user, String rawToken) {
        RefreshTokenEntity refreshToken = new RefreshTokenEntity();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hash(rawToken));
        refreshToken.setExpiresAt(Instant.now().plus(REFRESH_TOKEN_TTL));
        return refreshToken;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Impossible de hasher le refresh token", ex);
        }
    }

    public record RotatedRefreshToken(AppUserEntity user, String refreshToken) {
    }
}


