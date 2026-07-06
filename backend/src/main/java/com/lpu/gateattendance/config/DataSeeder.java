package com.lpu.gateattendance.config;

import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.Role;
import com.lpu.gateattendance.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            AppUser student1 = AppUser.builder()
                    .schoolId("2021-0001")
                    .firstName("John")
                    .lastName("Doe")
                    .role(Role.STUDENT)
                    .rfidTag("RFID-001")
                    .build();

            AppUser student2 = AppUser.builder()
                    .schoolId("2021-0002")
                    .firstName("Jane")
                    .lastName("Smith")
                    .role(Role.STUDENT)
                    .rfidTag("RFID-002")
                    .build();

            AppUser faculty1 = AppUser.builder()
                    .schoolId("FAC-001")
                    .firstName("Dr. Alan")
                    .lastName("Turing")
                    .role(Role.FACULTY)
                    .rfidTag("RFID-F01")
                    .build();

            userRepository.saveAll(List.of(student1, student2, faculty1));
            System.out.println("Mock data seeded successfully.");
        }

        if (userRepository.findBySchoolId("admin").isEmpty()) {
            AppUser admin = AppUser.builder()
                    .schoolId("admin")
                    .firstName("System")
                    .lastName("Admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();

            AppUser superAdmin = AppUser.builder()
                    .schoolId("superadmin")
                    .firstName("Super")
                    .lastName("Admin")
                    .password(passwordEncoder.encode("super123"))
                    .role(Role.SUPER_ADMIN)
                    .build();

            userRepository.saveAll(List.of(admin, superAdmin));
            System.out.println("Admin users seeded successfully.");
        }
    }
}
