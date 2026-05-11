package com.youssefdev.user.repository;

import com.youssefdev.user.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {

    @EntityGraph(attributePaths = "user")
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);
}


