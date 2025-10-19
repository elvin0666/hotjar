package com.srscons.hotjar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "replay_event_batches")
public class ReplayEventBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private Long timestamp;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    @Lob
    private String eventsJson;

    @Column(nullable = false)
    private Integer eventCount;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}