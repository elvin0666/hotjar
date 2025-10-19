package com.srscons.hotjar.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReplayIngestRequest {
    private String sessionId;
    private List<Object> events;
    private Long timestamp;
    private String url;
    private String userAgent;
    private Boolean sessionEnd;
}