package com.lpu.gateattendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Create or rename a custom field. */
@Data
public class FieldRequest {

    @NotBlank(message = "Field name is required")
    private String name;
}
