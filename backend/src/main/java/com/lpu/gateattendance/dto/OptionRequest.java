package com.lpu.gateattendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Create or rename a field option. */
@Data
public class OptionRequest {

    @NotBlank(message = "Option value is required")
    private String value;
}
