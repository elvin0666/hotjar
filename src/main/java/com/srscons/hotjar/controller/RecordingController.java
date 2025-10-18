package com.srscons.hotjar.controller;

import com.srscons.hotjar.dto.RecordEventRequest;
import com.srscons.hotjar.dto.StartSessionRequest;
import com.srscons.hotjar.entity.RecordingEvent;
import com.srscons.hotjar.entity.RecordingSession;
import com.srscons.hotjar.service.RecordingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recording")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startSession(@RequestBody StartSessionRequest request) {
        String sessionId = recordingService.startSession(request);
        Map<String, String> response = new HashMap<>();
        response.put("sessionId", sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/event")
    public ResponseEntity<Void> recordEvent(@RequestBody RecordEventRequest request) {
        recordingService.recordEvent(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/end/{sessionId}")
    public ResponseEntity<Void> endSession(@PathVariable String sessionId) {
        recordingService.endSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<RecordingSession> getSession(@PathVariable String sessionId) {
        RecordingSession session = recordingService.getSession(sessionId);
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.notFound().build();
    }

    @GetMapping("/events/{sessionId}")
    public ResponseEntity<List<RecordingEvent>> getEvents(@PathVariable String sessionId) {
        List<RecordingEvent> events = recordingService.getEvents(sessionId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<RecordingSession>> getAllSessions() {
        List<RecordingSession> sessions = recordingService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }
}