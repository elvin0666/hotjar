package com.srscons.hotjar.service;

import com.srscons.hotjar.dto.RecordEventRequest;
import com.srscons.hotjar.dto.StartSessionRequest;
import com.srscons.hotjar.entity.RecordingEvent;
import com.srscons.hotjar.entity.RecordingSession;
import com.srscons.hotjar.repository.RecordingEventRepository;
import com.srscons.hotjar.repository.RecordingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecordingService {

    private final RecordingSessionRepository sessionRepository;
    private final RecordingEventRepository eventRepository;

    @Transactional
    public String startSession(StartSessionRequest request) {
        RecordingSession session = new RecordingSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setUrl(request.getUrl());
        session.setViewportWidth(request.getViewportWidth());
        session.setViewportHeight(request.getViewportHeight());
        session.setUserAgent(request.getUserAgent());

        sessionRepository.save(session);
        return session.getSessionId();
    }

    @Transactional
    public void recordEvent(RecordEventRequest request) {
        RecordingEvent event = new RecordingEvent();
        event.setSessionId(request.getSessionId());
        event.setTimestamp(request.getTimestamp());
        event.setEventType(request.getEventType());
        event.setEventData(request.getEventData());

        eventRepository.save(event);
    }

    @Transactional
    public void endSession(String sessionId) {
        sessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            session.setEndTime(LocalDateTime.now());
            sessionRepository.save(session);
        });
    }

    public RecordingSession getSession(String sessionId) {
        return sessionRepository.findBySessionId(sessionId).orElse(null);
    }

    public List<RecordingEvent> getEvents(String sessionId) {
        return eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    public List<RecordingSession> getAllSessions() {
        return sessionRepository.findAll();
    }
}