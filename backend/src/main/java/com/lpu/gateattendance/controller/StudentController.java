package com.lpu.gateattendance.controller;

import com.lpu.gateattendance.dto.CreateStudentRequest;
import com.lpu.gateattendance.dto.StudentResponse;
import com.lpu.gateattendance.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<StudentResponse>> list() {
        return ResponseEntity.ok(studentService.listStudents());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(@Valid @ModelAttribute CreateStudentRequest request) {
        try {
            return ResponseEntity.ok(studentService.createStudent(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while creating the student.");
        }
    }
}
