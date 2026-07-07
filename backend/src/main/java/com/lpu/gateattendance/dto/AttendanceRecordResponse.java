package com.lpu.gateattendance.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AttendanceRecordResponse {
    private String id;
    private String name;
    private String studentNo;
    private String photo;
    // Custom-field id -> selected value for this student.
    private Map<String, String> fieldValues;
    private String date;    // yyyy-MM-dd
    private String timeIn;  // hh:mm:ss a
    private String timeOut; // hh:mm:ss a, null until a second scan that day
}
