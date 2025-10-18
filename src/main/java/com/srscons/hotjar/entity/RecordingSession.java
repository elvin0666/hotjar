package com.srscons.hotjar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "recording_sessions")
public class RecordingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(nullable = false)
    private Integer viewportWidth;

    @Column(nullable = false)
    private Integer viewportHeight;

    private String userAgent;

    @Column(length = 10000000)
    @Lob
    private String eventData;

    @PrePersist
    protected void onCreate() {
        startTime = LocalDateTime.now();
    }
}