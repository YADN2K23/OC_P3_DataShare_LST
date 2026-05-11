package com.youssefdev.user.service;

import com.youssefdev.authcore.jwt.JwtService;
import com.youssefdev.user.entity.AppUserEntity;
import com.youssefdev.user.exception.UserAlreadyExistsException;
import com.youssefdev.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public void register(String login, String password) {
        if (appUserRepository.findByLogin(login).isPresent()) {
            throw new UserAlreadyExistsException(login);
        }

        AppUserEntity user = new AppUserEntity();
        user.setLogin(login);
        user.setPasswordHash(passwordEncoder.encode(password));
        appUserRepository.save(user);
    }

    public AuthSession login(String login, String password) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(login, password)
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        AppUserEntity user = appUserRepository.findByLogin(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userDetails.getUsername()));
        String accessToken = jwtService.generateToken(userDetails, user.getTokenVersion());
        String refreshToken = refreshTokenService.issue(user);
        return new AuthSession(accessToken, refreshToken);
    }

    public AuthSession refresh(String refreshToken) {
        RefreshTokenService.RotatedRefreshToken rotated = refreshTokenService.rotate(refreshToken);
        UserDetails userDetails = org.springframework.security.core.userdetails.User.withUsername(rotated.user().getLogin())
                .password(rotated.user().getPasswordHash())
                .authorities(List.of())
                .build();
        String accessToken = jwtService.generateToken(userDetails, rotated.user().getTokenVersion());
        return new AuthSession(accessToken, rotated.refreshToken());
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }
}


