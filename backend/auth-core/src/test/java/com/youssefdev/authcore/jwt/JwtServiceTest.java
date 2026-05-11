package com.youssefdev.authcore.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("testSecretKeyForJwtThatIsLongEnoughToBeValid1234567890");
        jwtProperties.setExpirationMillis(86_400_000);
        jwtService = new JwtService(jwtProperties);
    }

    @Test
    void generateTokenShouldReturnToken() {
        UserDetails user = new User("testuser", "password", Collections.emptyList());

        String token = jwtService.generateToken(user, 2);

        assertThat(token).isNotBlank();
    }

    @Test
    void extractUsernameShouldReturnExpectedUsername() {
        UserDetails user = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(user, 2);

        String username = jwtService.extractUsername(token);

        assertThat(username).isEqualTo("testuser");
    }

    @Test
    void isTokenValidShouldReturnTrueForSameUser() {
        UserDetails user = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(user, 2);

        boolean isValid = jwtService.isTokenValid(token, user, 2);

        assertThat(isValid).isTrue();
    }

    @Test
    void isTokenValidShouldReturnFalseForDifferentUser() {
        UserDetails sourceUser = new User("testuser", "password", Collections.emptyList());
        UserDetails otherUser = new User("otheruser", "password", Collections.emptyList());
        String token = jwtService.generateToken(sourceUser, 2);

        boolean isValid = jwtService.isTokenValid(token, otherUser);

        assertThat(isValid).isFalse();
    }

    @Test
    void extractTokenVersionShouldReturnExpectedVersion() {
        UserDetails user = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(user, 7);

        int tokenVersion = jwtService.extractTokenVersion(token);

        assertThat(tokenVersion).isEqualTo(7);
    }

    @Test
    void isTokenValidShouldReturnFalseForDifferentTokenVersion() {
        UserDetails user = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(user, 2);

        boolean isValid = jwtService.isTokenValid(token, user, 3);

        assertThat(isValid).isFalse();
    }

    @Test
    void extractUsernameShouldFailForMalformedToken() {
        assertThatThrownBy(() -> jwtService.extractUsername("token-invalide"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void isTokenValidShouldReturnFalseForExpiredToken() throws InterruptedException {
        JwtProperties shortLivedProperties = new JwtProperties();
        shortLivedProperties.setSecret("testSecretKeyForJwtThatIsLongEnoughToBeValid1234567890");
        shortLivedProperties.setExpirationMillis(1);
        JwtService shortLivedJwtService = new JwtService(shortLivedProperties);

        UserDetails user = new User("testuser", "password", Collections.emptyList());
        String token = shortLivedJwtService.generateToken(user, 2);

        Thread.sleep(10);

        assertThatThrownBy(() -> shortLivedJwtService.isTokenValid(token, user))
                .isInstanceOf(ExpiredJwtException.class);
    }
}

