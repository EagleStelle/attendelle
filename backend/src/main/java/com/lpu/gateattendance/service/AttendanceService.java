package com.lpu.gateattendance.service;

import com.lpu.gateattendance.dto.AttendanceRecordResponse;
import com.lpu.gateattendance.dto.ScanRequest;
import com.lpu.gateattendance.dto.ScanResponse;
import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.AttendanceLog;
import com.lpu.gateattendance.model.LogType;
import com.lpu.gateattendance.model.Role;
import com.lpu.gateattendance.repository.AppUserRepository;
import com.lpu.gateattendance.repository.AttendanceLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AppUserRepository userRepository;
    private final AttendanceLogRepository logRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("hh:mm:ss a", Locale.ENGLISH);

    @Transactional
    public ScanResponse recordScan(ScanRequest request) {
        // Try finding user by RFID tag first, if not found try school ID
        Optional<AppUser> userOpt = userRepository.findByRfidTag(request.getIdentifier());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findBySchoolId(request.getIdentifier());
        }

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found with identifier: " + request.getIdentifier());
        }

        AppUser user = userOpt.get();

        // First scan of the day is a time in (ENTRY); every later scan that day
        // is a time out (EXIT) and overwrites the previous one at read time.
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        boolean scannedToday =
                logRepository.existsByUserIdAndTimestampBetween(user.getId(), dayStart, dayEnd);
        LogType newLogType = scannedToday ? LogType.EXIT : LogType.ENTRY;

        AttendanceLog newLog = AttendanceLog.builder()
                .user(user)
                .timestamp(now)
                .type(newLogType)
                .gateName(request.getGateName())
                .build();

        logRepository.save(newLog);

        return ScanResponse.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .name(fullName(user))
                .schoolId(user.getSchoolId())
                .photo(user.getPhotoUrl())
                .role(user.getRole().name())
                .logType(newLogType)
                .timestamp(newLog.getTimestamp())
                .gateName(newLog.getGateName())
                .message("Successfully recorded " + newLogType.name() + " for " + user.getFirstName())
                .build();
    }

    /**
     * One row per student per day. timeIn is the earliest scan of the day;
     * timeOut is the latest scan of the day, or null when there was only one.
     */
    public List<AttendanceRecordResponse> listRecords() {
        List<AttendanceLog> logs = logRepository.findByUser_RoleOrderByTimestampAsc(Role.STUDENT);

        // Group by student + date, preserving chronological order.
        Map<String, List<AttendanceLog>> groups = new LinkedHashMap<>();
        for (AttendanceLog log : logs) {
            String key = log.getUser().getId() + "|" + log.getTimestamp().toLocalDate();
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(log);
        }

        List<AttendanceRecordResponse> records = new ArrayList<>();
        for (List<AttendanceLog> group : groups.values()) {
            AttendanceLog first = group.get(0);
            AttendanceLog last = group.get(group.size() - 1);
            AppUser user = first.getUser();
            LocalDate date = first.getTimestamp().toLocalDate();

            records.add(AttendanceRecordResponse.builder()
                    .id(user.getId() + "-" + date)
                    .name(fullName(user))
                    .studentNo(user.getSchoolId())
                    .photo(user.getPhotoUrl())
                    .department(user.getDepartment())
                    .course(user.getCourse())
                    .school(user.getSchool())
                    .date(date.format(DATE_FMT))
                    .timeIn(fmtTime(first.getTimestamp()))
                    .timeOut(group.size() > 1 ? fmtTime(last.getTimestamp()) : null)
                    .build());
        }

        // Newest first.
        records.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return records;
    }

    private String fmtTime(LocalDateTime ts) {
        return LocalTime.from(ts).format(TIME_FMT).toUpperCase(Locale.ENGLISH);
    }

    private String fullName(AppUser user) {
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        if (last.isEmpty()) return first;
        if (first.isEmpty()) return last;
        return last + ", " + first;
    }
}
