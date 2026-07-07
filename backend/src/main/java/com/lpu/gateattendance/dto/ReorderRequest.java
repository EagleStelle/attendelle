package com.lpu.gateattendance.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/** Ordered list of ids defining the new display order. */
@Data
public class ReorderRequest {

    @NotEmpty(message = "Order list is required")
    private List<UUID> ids;
}
