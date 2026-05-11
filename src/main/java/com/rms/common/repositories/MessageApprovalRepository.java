package com.rms.common.repositories;

import com.rms.common.entities.MessageApprovalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageApprovalRepository extends JpaRepository<MessageApprovalEntity, Long> {
}
