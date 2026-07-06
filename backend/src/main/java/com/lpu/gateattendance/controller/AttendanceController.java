package com.lpu.gateattendance.controller;

import com.lpu.gateattendance.dto.ScanRequest;
import com.lpu.gateattendance.dto.ScanResponse;
import com.lpu.gateattendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*") // Allow frontend to call the API
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/scan")
    public ResponseEntity<?> recordScan(@Valid @RequestBody ScanRequest request) {
        try {
            ScanResponse response = attendanceService.recordScan(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while processing the scan.");
        }
    }
}
