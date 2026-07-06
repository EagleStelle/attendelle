package com.lpu.gateattendance.service;

import com.lpu.gateattendance.dto.ScanRequest;
import com.lpu.gateattendance.dto.ScanResponse;
import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.AttendanceLog;
import com.lpu.gateattendance.model.LogType;
import com.lpu.gateattendance.repository.AppUserRepository;
import com.lpu.gateattendance.repository.AttendanceLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AppUserRepository userRepository;
    private final AttendanceLogRepository logRepository;

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

        // Determine if Entry or Exit based on last log
        List<AttendanceLog> lastLogs = logRepository.findByUserIdOrderByTimestampDesc(user.getId());
        LogType newLogType = LogType.ENTRY; // Default to entry if no logs exist

        if (!lastLogs.isEmpty()) {
            AttendanceLog lastLog = lastLogs.get(0);
            if (lastLog.getType() == LogType.ENTRY) {
                newLogType = LogType.EXIT;
            } else {
                newLogType = LogType.ENTRY;
            }
        }

        // Create new log
        AttendanceLog newLog = AttendanceLog.builder()
                .user(user)
                .timestamp(LocalDateTime.now())
                .type(newLogType)
                .gateName(request.getGateName())
                .build();

        logRepository.save(newLog);

        return ScanResponse.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .schoolId(user.getSchoolId())
                .role(user.getRole().name())
                .logType(newLogType)
                .timestamp(newLog.getTimestamp())
                .gateName(newLog.getGateName())
                .message("Successfully recorded " + newLogType.name() + " for " + user.getFirstName())
                .build();
    }
}
