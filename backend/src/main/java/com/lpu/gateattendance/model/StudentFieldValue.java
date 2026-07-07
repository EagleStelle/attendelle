package com.lpu.gateattendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * The value a particular student holds for a particular {@link CustomField}.
 */
@Entity
@Table(
        name = "student_field_value",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "field_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFieldValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "field_id", nullable = false)
    private CustomField field;

    // "value" is a reserved SQL word; map to a safe column name.
    @Column(name = "field_value", nullable = false)
    private String value;
}
