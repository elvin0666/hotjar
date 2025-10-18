package com.srscons.hotjar.repository;

import com.srscons.hotjar.entity.RecordingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecordingSessionRepository extends JpaRepository<RecordingSession, Long> {
    Optional<RecordingSession> findBySessionId(String sessionId);
}