package com.lpu.gateattendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * A selectable value for a {@link CustomField}'s combobox.
 */
@Entity
@Table(name = "custom_field_option")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomFieldOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "field_id", nullable = false)
    private CustomField field;

    // "value" is a reserved SQL word; map to a safe column name.
    @Column(name = "option_value", nullable = false)
    private String value;

    @Column(nullable = false)
    private int displayOrder;
}
