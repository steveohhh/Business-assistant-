# SALES MANAGER PRO AI - IMPLEMENTATION ROADMAP

## PHASE 1: DATA ARCHITECTURE (COMPLETED)
- [x] **Update `types.ts`**:
    - Define `PsychometricProfile` (OCEAN, DISC).
    - Define `CognitiveProfile` (Abstraction, Tempo, Dissonance).
    - Define `BehavioralFlags` (Haggler, Risk, etc.).
    - Define `AssessmentData` (The 28-question H.I.Q. inputs).
    - Update `Customer` to include `assessmentData` and `psychProfile`.

## PHASE 2: THE AI BRAIN (COMPLETED)
- [x] **Update `geminiService.ts`**:
    - Construct the "Master Psychologist" prompt.
    - Map Questionnaire inputs to psychological outputs.
    - Implement JSON schema for structured handling strategies.
    - Add "Cognitive Pattern Matrix" analysis to the prompt.

## PHASE 3: UI - ASSESSMENT & VISUALIZATION (IN PROGRESS)
- [x] **Update `Customers.tsx`**:
    - Add Tab System to Customer Modal (Overview | Assessment | Psychology).
    - **Tab: Assessment**: Implement the 28-question "Human Intelligence Questionnaire" form.
    - **Tab: Psychology**: Build the visualization dashboard.
        - [x] OCEAN Bar Charts.
        - [x] DISC Radar/Bar representation.
        - [x] Archetype & Summary Cards.
        - [x] Handling Strategy & Triggers.
- [ ] **Next Steps**:
    - Refine the "Radar Chart" visualization for DISC using SVG.
    - Add "Temporal Behavior Mapping" (Time-based analytics).
    - Implement "Trust Velocity" tracking in the DataContext.

## PHASE 4: CONNECTIVITY
- [x] Ensure `POS` utilizes the `defaultPricePerGram` from Settings.
- [ ] Connect `PsychProfile` output to `POS` (e.g., flash warnings during a sale).

## NOTES
- The AI prompt is now extremely heavy; ensure `maxOutputTokens` is sufficient or use `gemini-2.5-flash` for speed.
- The Assessment form saves to `customer.assessmentData`. The AI reads this to generate `customer.psychProfile`.
