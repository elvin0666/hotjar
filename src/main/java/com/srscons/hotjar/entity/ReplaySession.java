package com.srscons.hotjar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "replay_sessions")
public class ReplaySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sessionId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime lastActivityTime;

    private LocalDateTime endTime;

    private String userAgent;

    @Column(nullable = false)
    private Integer eventCount = 0;

    private Boolean sessionEnded = false;

    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = LocalDateTime.now();
        }
        if (lastActivityTime == null) {
            lastActivityTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastActivityTime = LocalDateTime.now();
    }
}