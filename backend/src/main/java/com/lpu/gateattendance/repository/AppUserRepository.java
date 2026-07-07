package com.lpu.gateattendance.repository;

import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findBySchoolId(String schoolId);
    Optional<AppUser> findByRfidTag(String rfidTag);
    List<AppUser> findByRoleOrderByLastNameAscFirstNameAsc(Role role);
    boolean existsBySchoolId(String schoolId);
    boolean existsByRfidTag(String rfidTag);
}
