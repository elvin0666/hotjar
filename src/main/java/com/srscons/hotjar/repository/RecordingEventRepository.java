package com.srscons.hotjar.repository;

import com.srscons.hotjar.entity.RecordingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecordingEventRepository extends JpaRepository<RecordingEvent, Long> {
    List<RecordingEvent> findBySessionIdOrderByTimestampAsc(String sessionId);
}