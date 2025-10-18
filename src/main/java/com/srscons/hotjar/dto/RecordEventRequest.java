package com.srscons.hotjar.dto;

import lombok.Data;

@Data
public class RecordEventRequest {
    private String sessionId;
    private Long timestamp;
    private String eventType;
    private String eventData;
}