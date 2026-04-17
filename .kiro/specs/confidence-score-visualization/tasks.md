# Implementation Plan: Confidence Score Visualization

## Overview

This implementation plan converts the binary HIGH/LOW confidence system to numeric percentage scores (0-100%) across the PII detection system. The implementation follows a 3-layer scoring approach: regex pattern matching (30%), algorithmic validation (40%), and context analysis (30%). Changes span three components: backend JavaScript (piiDetector.js), frontend React (App.js), and Python report generator (report_generator.py).

## Tasks

- [ ] 1. Implement confidence score calculation in backend
  - [ ] 1.1 Add calculateConfidence() function to piiDetector.js
    - Create function with signature: `calculateConfidence(type, hasAlgorithmValidation, hasContextKeywords)`
    - Implement special cases: email always returns 100%, bank account with context returns 100%
    - Implement base score (30%) + algorithm layer (+40%) + context layer (+30%)
    - Add score clamping to ensure range [0, 100]
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [ ]* 1.2 Write property test for score range invariant
    - **Property 1: Score Range Invariant**
    - **Validates: Requirements 1.4**
    - Test that all combinations of validation flags produce scores in [0, 100]
  
  - [ ]* 1.3 Write property test for base score assignment
    - **Property 2: Base Score Assignment**
    - **Validates: Requirements 1.1**
    - Test that regex-only matches always return exactly 30%

- [ ] 2. Modify PII detection blocks to use numeric scores
  - [ ] 2.1 Update Aadhaar detection block
    - Track algorithmic validation result (isValidAadhaar)
    - Track context keyword detection result
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.2 Update PAN detection block
    - Track algorithmic validation result (isValidPAN)
    - Track context keyword detection result
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.3 Update Phone detection block
    - Track algorithmic validation result (isValidPhone)
    - Track context keyword detection result
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.4 Update Payment Card detection block
    - Track algorithmic validation result (isValidCardNumber)
    - Track context keyword detection result
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.5 Update IFSC detection block
    - Track algorithmic validation result (isValidIFSC)
    - Track context keyword detection result
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.6 Update Bank Account detection block
    - Track algorithmic validation result (isValidBankAccount)
    - Track context keyword detection result (already required)
    - Replace getConfidence() call with calculateConfidence()
    - Store numeric score in result object
    - _Requirements: 1.1, 1.2, 1.3, 1.6_
  
  - [ ] 2.7 Update Email detection block
    - Replace hardcoded "HIGH" string with calculateConfidence() call
    - Pass "email" type to ensure 100% score
    - _Requirements: 1.5_
  
  - [ ]* 2.8 Write property tests for algorithmic validation bonus
    - **Property 3: Algorithmic Validation Bonus**
    - **Validates: Requirements 1.2**
    - Test that regex + algorithm (no context) returns exactly 70%
  
  - [ ]* 2.9 Write property tests for context keyword bonus
    - **Property 4: Context Keyword Bonus**
    - **Validates: Requirements 1.3**
    - Test that context keywords add exactly 30% to score

- [ ] 3. Checkpoint - Verify backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update frontend confidence display
  - [ ] 4.1 Modify confidence badge rendering in App.js
    - Update badge content to display `{item.confidence}%` instead of string value
    - Update threshold comparison from `item.confidence === "HIGH"` to `item.confidence >= 70`
    - Add null/undefined handling to display "N/A" for missing confidence values
    - _Requirements: 2.1, 2.3, 2.4, 6.3, 6.4_
  
  - [ ] 4.2 Update summary statistics calculation
    - Modify highCount calculation to use numeric threshold `>= 70`
    - Ensure lowCount calculation uses `< 70`
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 4.3 Write property test for frontend percentage formatting
    - **Property 7: Frontend Percentage Formatting**
    - **Validates: Requirements 2.1**
    - Test that numeric scores render as "XX%" format
  
  - [ ]* 4.4 Write property test for frontend threshold styling
    - **Property 8: Frontend Threshold Styling**
    - **Validates: Requirements 2.3, 2.4, 6.1, 6.2, 6.3, 6.4**
    - Test that scores >= 70 get high-confidence styling, scores < 70 get low-confidence styling

- [ ] 5. Update Python report generator
  - [ ] 5.1 Modify confidence display in detailed breakdown table
    - Update confidence extraction to handle numeric values: `conf = item.get("confidence", 0)`
    - Format confidence as percentage string: `conf_str = f"{conf}%"`
    - Update threshold comparison from `conf == "HIGH"` to `conf >= 70`
    - Add type conversion error handling for invalid confidence values
    - _Requirements: 3.1, 3.3, 3.4, 6.5, 6.6_
  
  - [ ] 5.2 Add scoring methodology legend section
    - Create legend_style ParagraphStyle with fontSize=9, alignment=TA_LEFT
    - Create legend text with "ℹ️ Confidence Score Calculation:" header
    - List three scoring components: Regex (30%), Algorithm (+40%), Context (+30%)
    - Create legend table with light blue background (#E8F4F8) and ACCENT border
    - Insert legend after meta table and before summary cards
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 5.3 Update summary cards calculation
    - Modify high_count calculation to use numeric threshold `>= 70`
    - Update from `if item.get("confidence") == "HIGH"` to `if item.get("confidence", 0) >= 70`
    - _Requirements: 6.1, 6.5_
  
  - [ ]* 5.4 Write property test for PDF percentage formatting
    - **Property 9: PDF Percentage Formatting**
    - **Validates: Requirements 3.1**
    - Test that numeric scores display as "XX%" in PDF
  
  - [ ]* 5.5 Write property test for PDF threshold styling
    - **Property 10: PDF Threshold Styling**
    - **Validates: Requirements 3.3, 3.4, 6.5, 6.6**
    - Test that scores >= 70 use green color, scores < 70 use orange color

- [ ] 6. Checkpoint - Verify all components updated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Integration testing and validation
  - [ ] 7.1 Test end-to-end flow with sample documents
    - Upload test PDF with various PII types
    - Verify API response contains numeric confidence scores
    - Verify frontend displays percentage badges correctly
    - Verify PDF report contains percentage values and legend
    - _Requirements: 1.4, 2.1, 3.1, 4.6_
  
  - [ ]* 7.2 Write property test for score calculation determinism
    - **Property 11: Score Calculation Determinism**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Test that identical validation flags always produce identical scores
  
  - [ ]* 7.3 Write property test for threshold boundary consistency
    - **Property 12: Threshold Boundary Consistency**
    - **Validates: Requirements 6.1, 6.3, 6.5**
    - Test that score of exactly 70% is classified as high confidence everywhere
  
  - [ ]* 7.4 Run backward compatibility tests
    - Verify all existing detection patterns still work
    - Verify redaction behavior unchanged
    - Verify PDF report structure unchanged (all sections present)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 8. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- The 70% threshold is used consistently across all components for high/low classification
- Special cases (email=100%, bank account with context=100%) must be handled in calculateConfidence()
- No changes required to: uploadRoutes.js, redactor.js, textExtractor.js, piiPatterns.js, App.css
