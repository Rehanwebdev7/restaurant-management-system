package com.rms.common.repositories;

import com.rms.common.entities.AppVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppVersionRepository extends JpaRepository<AppVersionEntity, Long> {
    Optional<AppVersionEntity> findFirstByPlatformIgnoreCase(String platform);

    AppVersionEntity findTopByOrderByIdDesc();
}
