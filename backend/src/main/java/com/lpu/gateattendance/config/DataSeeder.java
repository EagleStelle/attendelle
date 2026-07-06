package com.lpu.gateattendance.config;

import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.model.Role;
import com.lpu.gateattendance.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;

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
    }
}
