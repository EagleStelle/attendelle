package com.lpu.gateattendance.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lpu.gateattendance.dto.CreateStudentRequest;
import com.lpu.gateattendance.dto.StudentResponse;
import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.CustomField;
import com.lpu.gateattendance.model.Role;
import com.lpu.gateattendance.model.StudentFieldValue;
import com.lpu.gateattendance.repository.AppUserRepository;
import com.lpu.gateattendance.repository.AttendanceLogRepository;
import com.lpu.gateattendance.repository.CustomFieldRepository;
import com.lpu.gateattendance.repository.StudentFieldValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final AppUserRepository userRepository;
    private final AttendanceLogRepository logRepository;
    private final FileStorageService fileStorageService;
    private final StudentFieldValueRepository fieldValueRepository;
    private final CustomFieldRepository fieldRepository;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
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
                .photoUrl(photoPath)
                .build();

        AppUser saved = userRepository.save(student);
        saveFieldValues(saved, parseFieldValues(request.getFieldValues()));
        return toResponse(saved);
    }

    @Transactional
    public StudentResponse updateStudent(UUID id, CreateStudentRequest request) {
        AppUser student = userRepository.findById(id)
                .filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        String schoolId = request.getIdNumber().trim();
        userRepository.findBySchoolId(schoolId).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new IllegalArgumentException("A student with ID Number " + schoolId + " already exists.");
            }
        });

        String rfid = blankToNull(request.getRfid());
        if (rfid != null) {
            userRepository.findByRfidTag(rfid).ifPresent(other -> {
                if (!other.getId().equals(id)) {
                    throw new IllegalArgumentException("RFID " + rfid + " is already assigned to another student.");
                }
            });
        }

        String[] name = splitName(request.getName());
        student.setSchoolId(schoolId);
        student.setFirstName(name[1]);
        student.setLastName(name[0]);
        student.setRfidTag(rfid);

        // Only replace the photo when a new file is uploaded; otherwise keep it.
        MultipartFile image = request.getImage();
        if (image != null && !image.isEmpty()) {
            String oldPhoto = student.getPhotoUrl();
            student.setPhotoUrl(fileStorageService.storeStudentPhoto(image));
            fileStorageService.deleteStudentPhoto(oldPhoto);
        }

        AppUser saved = userRepository.save(student);
        // Replace the whole set of values with the submitted ones.
        fieldValueRepository.deleteByUserId(id);
        fieldValueRepository.flush();
        saveFieldValues(saved, parseFieldValues(request.getFieldValues()));
        return toResponse(saved);
    }

    @Transactional
    public void deleteStudent(UUID id) {
        AppUser student = userRepository.findById(id)
                .filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        // Remove dependent rows first (FKs are NOT NULL, no DB cascade).
        fieldValueRepository.deleteByUserId(id);
        logRepository.deleteByUserId(id);
        userRepository.delete(student);
        fileStorageService.deleteStudentPhoto(student.getPhotoUrl());
    }

    // Persists one StudentFieldValue per submitted, non-blank entry whose field id
    // resolves to an existing CustomField. Unknown or blank entries are skipped.
    private void saveFieldValues(AppUser student, Map<String, String> values) {
        values.forEach((fieldId, value) -> {
            String trimmed = blankToNull(value);
            if (trimmed == null) return;
            CustomField field;
            try {
                field = fieldRepository.findById(UUID.fromString(fieldId)).orElse(null);
            } catch (IllegalArgumentException e) {
                field = null; // malformed id
            }
            if (field == null) return;
            fieldValueRepository.save(StudentFieldValue.builder()
                    .user(student)
                    .field(field)
                    .value(trimmed)
                    .build());
        });
    }

    private Map<String, String> parseFieldValues(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid field values payload.");
        }
    }

    private StudentResponse toResponse(AppUser user) {
        Map<String, String> values = new HashMap<>();
        fieldValueRepository.findByUserId(user.getId())
                .forEach(v -> values.put(v.getField().getId().toString(), v.getValue()));

        return StudentResponse.builder()
                .id(user.getId().toString())
                .name(fullName(user))
                .studentNo(user.getSchoolId())
                .rfid(user.getRfidTag())
                .fieldValues(values)
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
