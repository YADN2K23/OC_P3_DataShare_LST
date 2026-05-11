package com.youssefdev.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class LoginRateLimiter {

    private final ConcurrentMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxAttempts;
    private final Duration window;

    @Autowired
    public LoginRateLimiter(@Value("${security.login-rate-limit.max-attempts:5}") int maxAttempts,
                            @Value("${security.login-rate-limit.window-seconds:60}") long windowSeconds) {
        this(Clock.systemUTC(), maxAttempts, Duration.ofSeconds(windowSeconds));
    }

    LoginRateLimiter(Clock clock, int maxAttempts, Duration window) {
        this.clock = clock;
        this.maxAttempts = maxAttempts;
        this.window = window;
    }

    public boolean isAllowed(String login, String remoteAddress) {
        String key = key(login, remoteAddress);
        Instant now = Instant.now(clock);
        AttemptWindow attemptWindow = attempts.compute(key, (ignored, current) -> {
            if (current == null || !current.expiresAt().isAfter(now)) {
                return new AttemptWindow(0, now.plus(window));
            }
            return current;
        });
        return attemptWindow.count() < maxAttempts;
    }

    public void recordFailure(String login, String remoteAddress) {
        String key = key(login, remoteAddress);
        Instant now = Instant.now(clock);
        attempts.compute(key, (ignored, current) -> {
            if (current == null || !current.expiresAt().isAfter(now)) {
                return new AttemptWindow(1, now.plus(window));
            }
            return new AttemptWindow(current.count() + 1, current.expiresAt());
        });
    }

    public void recordSuccess(String login, String remoteAddress) {
        attempts.remove(key(login, remoteAddress));
    }

    private String key(String login, String remoteAddress) {
        String normalizedLogin = login == null ? "unknown" : login.trim().toLowerCase(Locale.ROOT);
        String normalizedAddress = remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress;
        return normalizedAddress + ":" + normalizedLogin;
    }

    private record AttemptWindow(int count, Instant expiresAt) {
    }
}
