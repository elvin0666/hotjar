package com.srscons.hotjar.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srscons.hotjar.dto.ReplayIngestRequest;
import com.srscons.hotjar.entity.ReplayEventBatch;
import com.srscons.hotjar.entity.ReplaySession;
import com.srscons.hotjar.repository.ReplayEventBatchRepository;
import com.srscons.hotjar.repository.ReplaySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReplayService {

    private final ReplaySessionRepository sessionRepository;
    private final ReplayEventBatchRepository eventBatchRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void ingestEvents(ReplayIngestRequest request) {
        try {
            // Create or update session
            ReplaySession session = sessionRepository.findBySessionId(request.getSessionId())
                    .orElseGet(() -> {
                        ReplaySession newSession = new ReplaySession();
                        newSession.setSessionId(request.getSessionId());
                        newSession.setUrl(request.getUrl());
                        newSession.setUserAgent(request.getUserAgent());
                        return newSession;
                    });

            // Update session metadata
            session.setEventCount(session.getEventCount() + request.getEvents().size());

            if (request.getSessionEnd() != null && request.getSessionEnd()) {
                session.setSessionEnded(true);
                session.setEndTime(LocalDateTime.now());
            }

            sessionRepository.save(session);

            // Store event batch
            ReplayEventBatch batch = new ReplayEventBatch();
            batch.setSessionId(request.getSessionId());
            batch.setTimestamp(request.getTimestamp());
            batch.setEventsJson(objectMapper.writeValueAsString(request.getEvents()));
            batch.setEventCount(request.getEvents().size());

            eventBatchRepository.save(batch);

            log.info("Ingested {} events for session {}", request.getEvents().size(), request.getSessionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize events for session {}", request.getSessionId(), e);
            throw new RuntimeException("Failed to process events", e);
        }
    }

    public ReplaySession getSession(String sessionId) {
        return sessionRepository.findBySessionId(sessionId).orElse(null);
    }

    public List<ReplaySession> getAllSessions() {
        return sessionRepository.findAll();
    }

    public List<ReplayEventBatch> getEventBatches(String sessionId) {
        return eventBatchRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    public String getFlatEvents(String sessionId) {
        List<ReplayEventBatch> batches = getEventBatches(sessionId);
        List<Object> allEvents = new ArrayList<>();

        for (ReplayEventBatch batch : batches) {
            try {
                String eventsJson = batch.getEventsJson();
                if (eventsJson != null && !eventsJson.isEmpty()) {
                    List<Object> batchEvents = objectMapper.readValue(eventsJson, new TypeReference<List<Object>>() {});
                    allEvents.addAll(batchEvents);
                }
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse events from batch for session {}, skipping batch", sessionId, e);
            }
        }

        try {
            return objectMapper.writeValueAsString(allEvents);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize combined events for session {}", sessionId, e);
            throw new RuntimeException("Failed to serialize events", e);
        }
    }

    @Transactional
    public void deleteSession(String sessionId) {
        eventBatchRepository.deleteBySessionId(sessionId);
        sessionRepository.findBySessionId(sessionId).ifPresent(sessionRepository::delete);
    }
}