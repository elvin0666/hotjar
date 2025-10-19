package com.srscons.hotjar.repository;

import com.srscons.hotjar.entity.ReplaySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReplaySessionRepository extends JpaRepository<ReplaySession, Long> {
    Optional<ReplaySession> findBySessionId(String sessionId);
}