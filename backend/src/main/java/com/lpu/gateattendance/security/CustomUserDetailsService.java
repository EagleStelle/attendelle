package com.lpu.gateattendance.security;

import com.lpu.gateattendance.model.AppUser;
import com.lpu.gateattendance.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // We use schoolId as username
        AppUser user = userRepository.findBySchoolId(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with schoolId: " + username));
        return user;
    }
}
