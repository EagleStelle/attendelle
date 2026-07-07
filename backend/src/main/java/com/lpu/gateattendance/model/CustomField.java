package com.lpu.gateattendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * An admin-configurable student attribute (a column in the students table and a
 * combobox field in the add/edit form). Options for the combobox are stored as
 * {@link CustomFieldOption} rows.
 */
@Entity
@Table(name = "custom_field")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Display label, e.g. "Department".
    @Column(nullable = false)
    private String name;

    // Position among the configurable columns; lower shows first.
    @Column(nullable = false)
    private int displayOrder;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<CustomFieldOption> options = new ArrayList<>();
}
