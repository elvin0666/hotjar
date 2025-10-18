package com.srscons.hotjar.dto;

import lombok.Data;

@Data
public class StartSessionRequest {
    private String url;
    private Integer viewportWidth;
    private Integer viewportHeight;
    private String userAgent;
}