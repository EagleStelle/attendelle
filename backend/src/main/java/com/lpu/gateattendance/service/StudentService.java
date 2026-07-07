package com.lpu.gateattendance.service;

import com.lpu.gateattendance.dto.CreateStudentRequest;
import com.lpu.gateattendance.dto.StudentResponse;
import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.Role;
import com.lpu.gateattendance.repository.AppUserRepository;
import com.lpu.gateattendance.repository.AttendanceLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final AppUserRepository userRepository;
    private final AttendanceLogRepository logRepository;
    private final FileStorageService fileStorageService;

    public List<StudentResponse> listStudents() {
        return userRepository.findByRoleOrderByLastNameAscFirstNameAsc(Role.STUDENT)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        String schoolId = request.getIdNumber().trim();
        if (userRepository.existsBySchoolId(schoolId)) {
            throw new IllegalArgumentException("A student with ID Number " + schoolId + " already exists.");
        }

        String rfid = blankToNull(request.getRfid());
        if (rfid != null && userRepository.existsByRfidTag(rfid)) {
            throw new IllegalArgumentException("RFID " + rfid + " is already assigned to another student.");
        }

        String[] name = splitName(request.getName());
        String photoPath = fileStorageService.storeStudentPhoto(request.getImage());

        AppUser student = AppUser.builder()
                .schoolId(schoolId)
                .firstName(name[1])
                .lastName(name[0])
                .role(Role.STUDENT)
                .rfidTag(rfid)
                .department(blankToNull(request.getDepartment()))
                .course(blankToNull(request.getCourse()))
                .school(blankToNull(request.getSchool()))
                .photoUrl(photoPath)
                .build();

        return toResponse(userRepository.save(student));
    }

    @Transactional
    public void deleteStudent(UUID id) {
        AppUser student = userRepository.findById(id)
                .filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        // Remove attendance logs first (FK user_id is NOT NULL, no DB cascade).
        logRepository.deleteByUserId(id);
        userRepository.delete(student);
        fileStorageService.deleteStudentPhoto(student.getPhotoUrl());
    }

    private StudentResponse toResponse(AppUser user) {
        return StudentResponse.builder()
                .id(user.getId().toString())
                .name(fullName(user))
                .studentNo(user.getSchoolId())
                .rfid(user.getRfidTag())
                .department(user.getDepartment())
                .course(user.getCourse())
                .school(user.getSchool())
                .photo(user.getPhotoUrl())
                .build();
    }

    // Builds "LASTNAME, FIRSTNAME"; falls back to whichever part exists.
    private String fullName(AppUser user) {
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        if (last.isEmpty()) return first;
        if (first.isEmpty()) return last;
        return last + ", " + first;
    }

    // Splits a display name into [lastName, firstName]. Accepts "LAST, FIRST"
    // or falls back to "FIRST ... LAST" / a single token.
    private String[] splitName(String raw) {
        String name = raw.trim();
        int comma = name.indexOf(',');
        if (comma >= 0) {
            String last = name.substring(0, comma).trim();
            String first = name.substring(comma + 1).trim();
            return new String[] { last, first };
        }
        return new String[] { "", name };
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
