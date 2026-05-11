package com.rms.common.repositories;

import com.rms.common.entities.AppVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppVersionRepository extends JpaRepository<AppVersionEntity, Long> {
}
