package com.lpu.gateattendance.dto;

import com.lpu.gateattendance.model.LogType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ScanResponse {
    private String firstName;
    private String lastName;
    private String schoolId;
    private String role;
    private LogType logType;
    private LocalDateTime timestamp;
    private String gateName;
    private String message;
}
