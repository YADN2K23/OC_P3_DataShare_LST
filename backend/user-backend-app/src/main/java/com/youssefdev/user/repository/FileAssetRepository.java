package com.youssefdev.user.repository;

import com.youssefdev.user.entity.FileAssetEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FileAssetRepository extends JpaRepository<FileAssetEntity, String> {

    /**
     * Find all files owned by a specific user with eager fetch.
     */
    @Query(value = "SELECT f FROM FileAssetEntity f JOIN FETCH f.owner WHERE f.owner.login = ?1",
            countQuery = "SELECT count(f) FROM FileAssetEntity f WHERE f.owner.login = ?1")
    Page<FileAssetEntity> findByOwner_Login(String login, Pageable pageable);

    /**
     * Find a file by its storage path with eager fetch of owner.
     */
    @Query("SELECT f FROM FileAssetEntity f JOIN FETCH f.owner WHERE f.storagePath = ?1")
    Optional<FileAssetEntity> findByStoragePath(String storagePath);

    /**
     * Find a file by ID and owner login with eager fetch of owner.
     */
    @Query("SELECT f FROM FileAssetEntity f JOIN FETCH f.owner WHERE f.id = ?1 AND f.owner.login = ?2")
    Optional<FileAssetEntity> findByIdAndOwner_Login(String id, String ownerLogin);
}


