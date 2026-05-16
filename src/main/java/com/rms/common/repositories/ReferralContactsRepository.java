package com.rms.common.repositories;

import com.rms.common.entities.ReferralContactsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferralContactsRepository extends JpaRepository<ReferralContactsEntity, Long> {
    Optional<ReferralContactsEntity> findFirstByReferrerCustomerId_IdAndNormalizedPhone(Long referrerCustomerId,
                                                                                         String normalizedPhone);

    Optional<ReferralContactsEntity> findFirstByNormalizedPhone(String normalizedPhone);

    List<ReferralContactsEntity> findByReferrerCustomerId_Id(Long referrerCustomerId);
}
