package com.srscons.hotjar.controller;

import com.srscons.hotjar.dto.ReplayIngestRequest;
import com.srscons.hotjar.entity.ReplayEventBatch;
import com.srscons.hotjar.entity.ReplaySession;
import com.srscons.hotjar.service.ReplayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/replay")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReplayController {

    private final ReplayService replayService;

    @PostMapping("/ingest")
    public ResponseEntity<Void> ingestEvents(@RequestBody ReplayIngestRequest request) {
        log.info("Received {} events for session {}",
                 request.getEvents().size(),
                 request.getSessionId());

        replayService.ingestEvents(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ReplaySession>> getAllSessions() {
        List<ReplaySession> sessions = replayService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ReplaySession> getSession(@PathVariable String sessionId) {
        ReplaySession session = replayService.getSession(sessionId);
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.notFound().build();
    }

    @GetMapping("/events/{sessionId}")
    public ResponseEntity<List<ReplayEventBatch>> getEventBatches(@PathVariable String sessionId) {
        List<ReplayEventBatch> batches = replayService.getEventBatches(sessionId);
        return ResponseEntity.ok(batches);
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionId) {
        replayService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }
}