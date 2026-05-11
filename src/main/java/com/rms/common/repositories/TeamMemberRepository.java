package com.rms.common.repositories;

import com.rms.common.entities.TeamMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMemberEntity, Long> {

    List<TeamMemberEntity> findByRestaurantId_IdOrderByDisplayOrderAsc(Long restaurantId);
}
