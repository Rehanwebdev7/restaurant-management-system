package com.rms.common.repositories;

import com.rms.common.entities.GlobalSettingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GlobalSettingRepository extends JpaRepository<GlobalSettingEntity, Long> {
}
