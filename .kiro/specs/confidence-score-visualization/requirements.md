# Requirements Document

## Introduction

This document specifies requirements for implementing numeric confidence score visualization (0-100%) in the PII detection system. The current system uses binary confidence levels (HIGH/LOW) which will be replaced with percentage-based scores calculated from a 3-layer scoring system: regex pattern matching (30%), algorithmic validation (40%), and context analysis (30%).

## Glossary

- **PII_Detector**: The backend system component that detects personally identifiable information in documents
- **Confidence_Score**: A numeric percentage value (0-100%) representing detection accuracy
- **Frontend_Dashboard**: The React-based user interface displaying detection results
- **PDF_Report**: The generated report document containing detection statistics and highlighted PII
- **Scoring_Legend**: An informational text block explaining the confidence score calculation methodology
- **Regex_Layer**: The pattern matching detection layer contributing 30% to the confidence score
- **Algorithm_Layer**: The validation layer (Verhoeff, Luhn, TRAI, RBI, IT Dept) contributing 40% to the confidence score
- **Context_Layer**: The keyword proximity detection layer contributing 30% to the confidence score

## Requirements

### Requirement 1: Numeric Confidence Score Calculation

**User Story:** As a system developer, I want the PII detector to calculate numeric confidence scores based on detection layer validation, so that users receive precise accuracy information.

#### Acceptance Criteria

1. WHEN the Regex_Layer matches a PII pattern, THE PII_Detector SHALL assign a base score of 30%
2. WHEN the Algorithm_Layer validates the matched pattern, THE PII_Detector SHALL add 40% to the base score
3. WHEN the Context_Layer detects proximity keywords, THE PII_Detector SHALL add 30% to the current score
4. THE PII_Detector SHALL return confidence scores as numeric percentages between 0 and 100
5. WHEN an email address is detected, THE PII_Detector SHALL assign a confidence score of 100%
6. WHEN a bank account is detected with mandatory context, THE PII_Detector SHALL assign a confidence score of 100%

### Requirement 2: Frontend Confidence Display

**User Story:** As a user, I want to see numeric percentage scores instead of HIGH/LOW labels in the dashboard, so that I understand the precise confidence level of each detection.

#### Acceptance Criteria

1. WHEN detection results are displayed, THE Frontend_Dashboard SHALL render confidence scores as percentages with the "%" symbol
2. THE Frontend_Dashboard SHALL display confidence scores in the confidence badge component for each detected PII item
3. WHEN a confidence score is 70% or higher, THE Frontend_Dashboard SHALL style the badge with high-confidence visual indicators
4. WHEN a confidence score is below 70%, THE Frontend_Dashboard SHALL style the badge with low-confidence visual indicators
5. THE Frontend_Dashboard SHALL maintain all existing layout and functionality while displaying numeric scores

### Requirement 3: PDF Report Confidence Display

**User Story:** As a user, I want to see numeric percentage scores in the PDF report, so that I have accurate confidence information in the exported document.

#### Acceptance Criteria

1. WHEN the PDF_Report is generated, THE report generator SHALL display confidence scores as percentages with the "%" symbol
2. THE report generator SHALL render confidence scores in the detailed breakdown table for each PII entry
3. WHEN a confidence score is 70% or higher, THE report generator SHALL apply high-confidence styling (green color)
4. WHEN a confidence score is below 70%, THE report generator SHALL apply low-confidence styling (orange color)
5. THE report generator SHALL maintain all existing report sections and formatting while displaying numeric scores

### Requirement 4: Scoring Methodology Legend

**User Story:** As a user, I want to understand how confidence scores are calculated, so that I can interpret the accuracy of detections.

#### Acceptance Criteria

1. THE report generator SHALL include a Scoring_Legend section at the top of the PDF_Report
2. THE Scoring_Legend SHALL display the text "ℹ️ Confidence Score Calculation:"
3. THE Scoring_Legend SHALL list "Regex Pattern Match: 30%" as the first scoring component
4. THE Scoring_Legend SHALL list "Algorithmic Validation: +40%" as the second scoring component
5. THE Scoring_Legend SHALL list "Context Keywords: +30%" as the third scoring component
6. THE Scoring_Legend SHALL appear only once in the PDF_Report before the detailed breakdown section

### Requirement 5: Backward Compatibility

**User Story:** As a system maintainer, I want all existing functionality to remain operational after implementing numeric scores, so that no features are broken by this change.

#### Acceptance Criteria

1. THE PII_Detector SHALL maintain all existing detection logic without modification
2. THE system SHALL continue to process PDF and DOCX files without changes to file handling
3. THE system SHALL continue to generate redacted documents with identical redaction behavior
4. THE system SHALL continue to generate PDF reports with all existing sections intact
5. THE Frontend_Dashboard SHALL maintain all existing user interactions and workflows
6. WHEN the confidence score implementation is complete, THE system SHALL pass all existing validation tests

### Requirement 6: Score Threshold Mapping

**User Story:** As a developer, I want to map numeric scores to visual confidence indicators, so that the UI maintains intuitive high/low confidence distinctions.

#### Acceptance Criteria

1. WHEN a confidence score is 70% or greater, THE system SHALL classify it as high confidence
2. WHEN a confidence score is less than 70%, THE system SHALL classify it as low confidence
3. THE Frontend_Dashboard SHALL apply high-confidence styling to scores of 70% or greater
4. THE Frontend_Dashboard SHALL apply low-confidence styling to scores below 70%
5. THE PDF_Report SHALL apply high-confidence color (green) to scores of 70% or greater
6. THE PDF_Report SHALL apply low-confidence color (orange) to scores below 70%
