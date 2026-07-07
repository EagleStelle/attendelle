package com.lpu.gateattendance.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FieldResponse {
    private String id;
    private String name;
    private int displayOrder;
    private List<OptionResponse> options;

    @Data
    @Builder
    public static class OptionResponse {
        private String id;
        private String value;
        private int displayOrder;
    }
}
