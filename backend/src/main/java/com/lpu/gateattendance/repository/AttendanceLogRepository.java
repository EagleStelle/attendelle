package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {
    List<AttendanceLog> findByUserIdOrderByTimestampDesc(UUID userId);
    void deleteByUserId(UUID userId);
}
