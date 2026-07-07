package com.lpu.gateattendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreateStudentRequest {

    @NotBlank(message = "ID Number is required")
    private String idNumber;

    @NotBlank(message = "Name is required")
    private String name;

    // Optional: populated by the RFID reader while the Add Student form is open.
    private String rfid;

    // JSON object mapping custom-field id -> selected value, e.g.
    // {"<fieldId>":"CCS","<fieldId>":"BSCS"}. Sent as a multipart form field.
    private String fieldValues;

    // Optional uploaded photo. The file is stored on disk and only its path
    // is persisted to the database.
    private MultipartFile image;
}
