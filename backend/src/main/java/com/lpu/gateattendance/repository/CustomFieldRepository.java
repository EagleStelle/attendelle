package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomFieldRepository extends JpaRepository<CustomField, UUID> {
    List<CustomField> findAllByOrderByDisplayOrderAsc();
}
