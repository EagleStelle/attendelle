package com.lpu.gateattendance.controller;

import com.lpu.gateattendance.dto.FieldRequest;
import com.lpu.gateattendance.dto.FieldResponse;
import com.lpu.gateattendance.dto.OptionRequest;
import com.lpu.gateattendance.dto.ReorderRequest;
import com.lpu.gateattendance.service.CustomFieldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fields")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldService fieldService;

    @GetMapping
    public ResponseEntity<List<FieldResponse>> list() {
        return ResponseEntity.ok(fieldService.listFields());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody FieldRequest request) {
        return handle(() -> fieldService.createField(request.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> rename(@PathVariable UUID id, @Valid @RequestBody FieldRequest request) {
        return handle(() -> fieldService.renameField(id, request.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            fieldService.deleteField(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete field.");
        }
    }

    @PutMapping("/reorder")
    public ResponseEntity<?> reorder(@Valid @RequestBody ReorderRequest request) {
        return handle(() -> fieldService.reorderFields(request.getIds()));
    }

    @PostMapping("/{id}/options")
    public ResponseEntity<?> addOption(@PathVariable UUID id, @Valid @RequestBody OptionRequest request) {
        return handle(() -> fieldService.addOption(id, request.getValue()));
    }

    @PutMapping("/options/{optionId}")
    public ResponseEntity<?> renameOption(@PathVariable UUID optionId, @Valid @RequestBody OptionRequest request) {
        return handle(() -> fieldService.renameOption(optionId, request.getValue()));
    }

    @DeleteMapping("/options/{optionId}")
    public ResponseEntity<?> deleteOption(@PathVariable UUID optionId) {
        return handle(() -> fieldService.deleteOption(optionId));
    }

    // Wraps a service call, mapping known validation errors to 400.
    private ResponseEntity<?> handle(java.util.function.Supplier<?> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred.");
        }
    }
}
