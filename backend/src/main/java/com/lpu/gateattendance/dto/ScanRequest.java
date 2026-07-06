package com.lpu.gateattendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanRequest {
    @NotBlank(message = "Identifier (RFID tag or School ID) is required")
    private String identifier; 

    @NotBlank(message = "Gate name is required")
    private String gateName;
}
