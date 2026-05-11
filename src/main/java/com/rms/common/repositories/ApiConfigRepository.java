package com.rms.common.repositories;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import org.springframework.stereotype.Repository;

import com.rms.common.entities.ApiConfigEntity;


@Repository
public interface ApiConfigRepository extends JpaRepository<ApiConfigEntity, Integer> {
    // Custom Methods
    Page<ApiConfigEntity> findAll(Pageable pageable);

	ApiConfigEntity findByService(String string);
	
}
