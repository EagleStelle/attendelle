package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.CustomFieldOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomFieldOptionRepository extends JpaRepository<CustomFieldOption, UUID> {
}
