package com.youssefdev.user.repository;

import com.youssefdev.user.entity.ShareLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLinkEntity, String> {

    /**
     * Find a share link by its token with eager fetch of file.
     */
    @Query("SELECT s FROM ShareLinkEntity s JOIN FETCH s.file WHERE s.token = ?1")
    Optional<ShareLinkEntity> findByToken(String token);

    /**
     * Find all share links for a specific file.
     */
    List<ShareLinkEntity> findByFile_Id(String fileId);
}


