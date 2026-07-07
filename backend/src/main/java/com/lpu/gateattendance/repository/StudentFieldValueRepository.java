package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.StudentFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentFieldValueRepository extends JpaRepository<StudentFieldValue, UUID> {
    List<StudentFieldValue> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);

    void deleteByFieldId(UUID fieldId);
}
