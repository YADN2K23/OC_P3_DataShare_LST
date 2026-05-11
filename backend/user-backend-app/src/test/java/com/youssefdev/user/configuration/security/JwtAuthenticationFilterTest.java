package com.youssefdev.user.configuration.security;

import com.youssefdev.user.entity.AppUserEntity;
import com.youssefdev.user.repository.AppUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private com.youssefdev.authcore.jwt.JwtService jwtService;

    @Mock
    private AppUserDetailsService userDetailsService;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService, appUserRepository);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldContinueWhenAuthorizationHeaderIsMissing() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldContinueWhenAuthorizationHeaderIsNotBearer() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Basic abc123");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldNotAuthenticateWhenUsernameExtractionReturnsNull() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        when(jwtService.extractUsername("token")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldNotAuthenticateWhenTokenIsInvalid() throws ServletException, IOException {
        UserDetails user = new User("demo", "password", Collections.emptyList());
        AppUserEntity appUser = new AppUserEntity();
        appUser.setLogin("demo");
        appUser.setTokenVersion(0);
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        when(jwtService.extractUsername("token")).thenReturn("demo");
        when(userDetailsService.loadUserByUsername("demo")).thenReturn(user);
        when(appUserRepository.findByLogin("demo")).thenReturn(Optional.of(appUser));
        when(jwtService.isTokenValid("token", user, 0)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldAuthenticateWhenTokenIsValid() throws ServletException, IOException {
        UserDetails user = new User("demo", "password", Collections.emptyList());
        AppUserEntity appUser = new AppUserEntity();
        appUser.setLogin("demo");
        appUser.setTokenVersion(0);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtService.extractUsername("valid-token")).thenReturn("demo");
        when(userDetailsService.loadUserByUsername("demo")).thenReturn(user);
        when(appUserRepository.findByLogin("demo")).thenReturn(Optional.of(appUser));
        when(jwtService.isTokenValid("valid-token", user, 0)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("demo");
    }

    @Test
    void shouldNotAuthenticateWhenTokenVersionIsOutdated() throws ServletException, IOException {
        UserDetails user = new User("demo", "password", Collections.emptyList());
        AppUserEntity appUser = new AppUserEntity();
        appUser.setLogin("demo");
        appUser.setTokenVersion(3);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtService.extractUsername("valid-token")).thenReturn("demo");
        when(userDetailsService.loadUserByUsername("demo")).thenReturn(user);
        when(appUserRepository.findByLogin("demo")).thenReturn(Optional.of(appUser));
        when(jwtService.isTokenValid("valid-token", user, 3)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldContinueWithoutAuthenticationWhenTokenIsMalformed() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer broken-token");
        when(jwtService.extractUsername("broken-token")).thenThrow(new RuntimeException("Malformed token"));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}

