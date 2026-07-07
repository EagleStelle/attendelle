package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.AttendanceLog;
import com.lpu.gateattendance.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {
    List<AttendanceLog> findByUserIdOrderByTimestampDesc(UUID userId);
    void deleteByUserId(UUID userId);
    List<AttendanceLog> findByUser_RoleOrderByTimestampAsc(Role role);
    boolean existsByUserIdAndTimestampBetween(UUID userId, LocalDateTime start, LocalDateTime end);
}
