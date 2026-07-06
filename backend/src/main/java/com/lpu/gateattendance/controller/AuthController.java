package com.lpu.gateattendance.controller;

import com.lpu.gateattendance.dto.AuthRequest;
import com.lpu.gateattendance.dto.AuthResponse;
import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getSchoolId(), request.getPassword())
        );

        AppUser user = (AppUser) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(user);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwt)
                .schoolId(user.getSchoolId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build());
    }
}
