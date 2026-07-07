package com.lpu.gateattendance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttendanceRecordResponse {
    private String id;
    private String name;
    private String studentNo;
    private String photo;
    private String department;
    private String course;
    private String school;
    private String date;    // yyyy-MM-dd
    private String timeIn;  // hh:mm:ss a
    private String timeOut; // hh:mm:ss a, null until a second scan that day
}
