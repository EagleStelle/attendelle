package com.lpu.gateattendance.service;

import com.lpu.gateattendance.dto.FieldResponse;
import com.lpu.gateattendance.model.CustomField;
import com.lpu.gateattendance.model.CustomFieldOption;
import com.lpu.gateattendance.repository.CustomFieldOptionRepository;
import com.lpu.gateattendance.repository.CustomFieldRepository;
import com.lpu.gateattendance.repository.StudentFieldValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldRepository fieldRepository;
    private final CustomFieldOptionRepository optionRepository;
    private final StudentFieldValueRepository valueRepository;

    @Transactional(readOnly = true)
    public List<FieldResponse> listFields() {
        return fieldRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FieldResponse createField(String name) {
        int nextOrder = fieldRepository.findAll().size();
        CustomField field = CustomField.builder()
                .name(name.trim())
                .displayOrder(nextOrder)
                .build();
        return toResponse(fieldRepository.save(field));
    }

    @Transactional
    public FieldResponse renameField(UUID id, String name) {
        CustomField field = getField(id);
        field.setName(name.trim());
        return toResponse(fieldRepository.save(field));
    }

    @Transactional
    public void deleteField(UUID id) {
        CustomField field = getField(id);
        // Drop every student's value for this field first (no DB cascade).
        valueRepository.deleteByFieldId(id);
        fieldRepository.delete(field);
    }

    @Transactional
    public List<FieldResponse> reorderFields(List<UUID> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            CustomField field = getField(orderedIds.get(i));
            field.setDisplayOrder(i);
            fieldRepository.save(field);
        }
        return listFields();
    }

    @Transactional
    public FieldResponse addOption(UUID fieldId, String value) {
        CustomField field = getField(fieldId);
        CustomFieldOption option = CustomFieldOption.builder()
                .field(field)
                .value(value.trim())
                .displayOrder(field.getOptions().size())
                .build();
        // Add through the parent collection so cascade persists it and the
        // in-memory state (used to build the response) stays in sync.
        field.getOptions().add(option);
        fieldRepository.save(field);
        return toResponse(field);
    }

    @Transactional
    public FieldResponse renameOption(UUID optionId, String value) {
        CustomFieldOption option = optionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Option not found."));
        option.setValue(value.trim());
        optionRepository.save(option);
        return toResponse(option.getField());
    }

    @Transactional
    public FieldResponse deleteOption(UUID optionId) {
        CustomFieldOption option = optionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Option not found."));
        CustomField field = option.getField();
        // Remove through the parent collection so orphanRemoval actually deletes
        // it; deleting the option directly gets re-persisted via the cascade.
        field.getOptions().removeIf(o -> o.getId().equals(optionId));
        fieldRepository.save(field);
        return toResponse(field);
    }

    private CustomField getField(UUID id) {
        return fieldRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Field not found."));
    }

    private FieldResponse toResponse(CustomField field) {
        List<FieldResponse.OptionResponse> options = field.getOptions().stream()
                .map(o -> FieldResponse.OptionResponse.builder()
                        .id(o.getId().toString())
                        .value(o.getValue())
                        .displayOrder(o.getDisplayOrder())
                        .build())
                .toList();
        return FieldResponse.builder()
                .id(field.getId().toString())
                .name(field.getName())
                .displayOrder(field.getDisplayOrder())
                .options(options)
                .build();
    }
}
