package com.lpu.gateattendance.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class StudentResponse {
    private String id;
    private String name;
    private String studentNo;
    private String rfid;
    // Custom-field id -> selected value for this student.
    private Map<String, String> fieldValues;
    private String photo;
    private boolean archived;
}
