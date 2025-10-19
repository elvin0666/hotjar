package com.srscons.hotjar.repository;

import com.srscons.hotjar.entity.ReplayEventBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplayEventBatchRepository extends JpaRepository<ReplayEventBatch, Long> {
    List<ReplayEventBatch> findBySessionIdOrderByTimestampAsc(String sessionId);
    void deleteBySessionId(String sessionId);
}