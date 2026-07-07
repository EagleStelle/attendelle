package com.lpu.gateattendance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentResponse {
    private String id;
    private String name;
    private String studentNo;
    private String rfid;
    private String department;
    private String course;
    private String school;
    private String photo;
}
