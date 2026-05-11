package com.youssefdev.user.controller;

import com.youssefdev.user.dto.LoginRequest;
import com.youssefdev.user.dto.LoginResponse;
import com.youssefdev.user.dto.RegisterRequest;
import com.youssefdev.user.service.AuthService;
import com.youssefdev.user.service.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger SECURITY_LOG = LoggerFactory.getLogger("security.audit");
    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final Duration REFRESH_COOKIE_TTL = Duration.ofDays(30);

    private final AuthService authService;
    private final LoginRateLimiter loginRateLimiter;

    @Value("${auth.refresh-cookie-secure:false}")
    private boolean refreshCookieSecure;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.login(), request.password());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest servletRequest) {
        String remoteAddress = servletRequest.getRemoteAddr();
        if (!loginRateLimiter.isAllowed(request.login(), remoteAddress)) {
            SECURITY_LOG.warn("login_rate_limited login={} remoteAddress={}", request.login(), remoteAddress);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives de connexion");
        }

        var session = authenticateAndTrack(request, remoteAddress);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(session.refreshToken()).toString())
                .body(new LoginResponse(session.accessToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@CookieValue(value = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        var session = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(session.refreshToken()).toString())
                .body(new LoginResponse(session.accessToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        SECURITY_LOG.info("logout refreshTokenPresent={}", refreshToken != null && !refreshToken.isBlank());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> me(Principal principal) {
        return ResponseEntity.ok(Map.of("login", principal.getName()));
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/api")
                .maxAge(REFRESH_COOKIE_TTL)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Duration.ZERO)
                .build();
    }

    private com.youssefdev.user.service.AuthSession authenticateAndTrack(LoginRequest request, String remoteAddress) {
        try {
            var session = authService.login(request.login(), request.password());
            loginRateLimiter.recordSuccess(request.login(), remoteAddress);
            SECURITY_LOG.info("login_success login={} remoteAddress={}", request.login(), remoteAddress);
            return session;
        } catch (AuthenticationException ex) {
            loginRateLimiter.recordFailure(request.login(), remoteAddress);
            SECURITY_LOG.warn("login_failure login={} remoteAddress={}", request.login(), remoteAddress);
            throw ex;
        }
    }
}


