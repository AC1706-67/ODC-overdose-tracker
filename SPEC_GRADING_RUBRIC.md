# Spec Grading Rubric

## Purpose

This rubric helps evaluate whether a feature/spec is truly "done" and production-ready. Use it for code reviews, QA, and self-assessment.

## Grading Scale

- **A (Excellent)**: Production-ready, exceeds standards
- **B (Good)**: Production-ready, meets all standards
- **C (Acceptable)**: Works but needs minor improvements
- **D (Needs Work)**: Major issues, not production-ready
- **F (Incomplete)**: Doesn't work or missing critical parts

---

## 1. Functionality (30 points)

### Core Requirements (15 points)

- [ ] **Feature works as specified** (5 pts)
  - All acceptance criteria met
  - Happy path works perfectly
  - Edge cases handled

- [ ] **Error handling** (5 pts)
  - Graceful error messages
  - No crashes or white screens
  - User can recover from errors

- [ ] **Data validation** (5 pts)
  - Input validation on client
  - Server-side validation (RLS)
  - Prevents invalid data

### User Experience (15 points)

- [ ] **Intuitive UI** (5 pts)
  - Clear labels and instructions
  - Consistent with app design
  - Accessible (screen readers, contrast)

- [ ] **Performance** (5 pts)
  - Loads in < 2 seconds
  - No janky animations
  - Efficient queries (no N+1)

- [ ] **Feedback** (5 pts)
  - Loading states shown
  - Success/error messages
  - Progress indicators

**Functionality Score: \_\_\_ / 30**

---

## 2. Code Quality (25 points)

### Structure (10 points)

- [ ] **Clean code** (3 pts)
  - Readable variable names
  - Functions < 50 lines
  - No code duplication

- [ ] **Type safety** (4 pts)
  - TypeScript types defined
  - No `any` types (unless justified)
  - Proper interfaces/types

- [ ] **Organization** (3 pts)
  - Files in correct folders
  - Logical component structure
  - Imports organized

### Best Practices (15 points)

- [ ] **Error handling** (5 pts)
  - Try-catch blocks
  - Error boundaries (React)
  - Fallback UI

- [ ] **Logging & debugging** (5 pts)
  - Strategic console.logs or logger
  - Assertions for critical paths
  - Performance timing for slow ops

- [ ] **Security** (5 pts)
  - No hardcoded secrets
  - Input sanitization
  - RLS policies applied

**Code Quality Score: \_\_\_ / 25**

---

## 3. Testing & Reliability (20 points)

### Manual Testing (10 points)

- [ ] **Happy path tested** (3 pts)
  - Feature works end-to-end
  - Tested on real device
  - Multiple scenarios tested

- [ ] **Edge cases tested** (4 pts)
  - Empty states
  - Network errors
  - Invalid inputs

- [ ] **Cross-platform** (3 pts)
  - Works on Android
  - Works on iOS (if applicable)
  - Responsive on different screens

### Automated Testing (10 points)

- [ ] **Unit tests** (5 pts)
  - Critical functions tested
  - Edge cases covered
  - Tests pass

- [ ] **Integration tests** (5 pts)
  - API calls tested
  - Database operations tested
  - End-to-end flows tested

**Testing Score: \_\_\_ / 20**

---

## 4. Documentation (15 points)

### Code Documentation (8 points)

- [ ] **Comments** (3 pts)
  - Complex logic explained
  - Why, not what
  - No obvious comments

- [ ] **Function docs** (3 pts)
  - JSDoc for public functions
  - Parameters documented
  - Return values documented

- [ ] **README updates** (2 pts)
  - New features documented
  - Setup instructions updated
  - Examples provided

### User Documentation (7 points)

- [ ] **User guide** (4 pts)
  - How to use feature
  - Screenshots/videos
  - Common issues addressed

- [ ] **API docs** (3 pts)
  - Endpoints documented
  - Request/response examples
  - Error codes explained

**Documentation Score: \_\_\_ / 15**

---

## 5. Database & Backend (10 points)

### Schema (5 points)

- [ ] **Proper structure** (2 pts)
  - Normalized tables
  - Correct data types
  - Foreign keys defined

- [ ] **Migrations** (2 pts)
  - Migration scripts created
  - Reversible (if needed)
  - Tested on staging

- [ ] **Indexes** (1 pt)
  - Query performance optimized
  - Indexes on foreign keys
  - No slow queries

### Security (5 points)

- [ ] **RLS policies** (3 pts)
  - Row-level security enabled
  - Policies tested
  - No data leaks

- [ ] **Audit trail** (2 pts)
  - created_by tracked
  - created_at/updated_at set
  - Changes logged

**Database Score: \_\_\_ / 10**

---

## Total Score: \_\_\_ / 100

### Grade Interpretation

| Score  | Grade | Status                          |
| ------ | ----- | ------------------------------- |
| 90-100 | A     | Excellent - Ship it!            |
| 80-89  | B     | Good - Minor tweaks, then ship  |
| 70-79  | C     | Acceptable - Needs improvements |
| 60-69  | D     | Needs Work - Major issues       |
| < 60   | F     | Incomplete - Not ready          |

---

## Example: Grading the Signup Feature

### 1. Functionality: 28/30

- ✅ Core Requirements: 14/15 (works great, minor validation improvement)
- ✅ User Experience: 14/15 (good UX, could add password strength indicator)

### 2. Code Quality: 22/25

- ✅ Structure: 9/10 (clean code, good types)
- ✅ Best Practices: 13/15 (has error handling, needs more logging)

### 3. Testing: 15/20

- ✅ Manual Testing: 9/10 (tested on device, works well)
- ⚠️ Automated Testing: 6/10 (no unit tests yet)

### 4. Documentation: 10/15

- ⚠️ Code Documentation: 5/8 (some comments, needs JSDoc)
- ⚠️ User Documentation: 5/7 (basic docs, needs screenshots)

### 5. Database: 9/10

- ✅ Schema: 5/5 (proper structure, migrations)
- ✅ Security: 4/5 (RLS enabled, needs audit columns)

**Total: 84/100 - Grade B (Good)**

**Verdict**: Production-ready! Minor improvements recommended:

- Add unit tests for validation logic
- Add JSDoc to signup function
- Add password strength indicator
- Add audit columns (created_by)

---

## Quick Checklist (Minimum for Grade B)

Before marking a feature "done", ensure:

- [ ] ✅ Feature works end-to-end
- [ ] ✅ Error handling in place
- [ ] ✅ Tested on real device
- [ ] ✅ No hardcoded secrets
- [ ] ✅ RLS policies applied
- [ ] ✅ Logging added for debugging
- [ ] ✅ Code reviewed
- [ ] ✅ Documentation updated
- [ ] ✅ No console errors
- [ ] ✅ Performance acceptable

---

## Using This Rubric

### For New Features

1. Review requirements against rubric
2. Build feature
3. Self-grade using rubric
4. Fix issues until Grade B or higher
5. Get peer review
6. Ship!

### For Code Reviews

1. Reviewer uses rubric to evaluate
2. Provide specific feedback per category
3. Assign grade
4. Developer addresses feedback
5. Re-review until acceptable

### For QA Testing

1. QA uses rubric for testing
2. Focus on Functionality & Testing sections
3. Document issues found
4. Assign grade
5. Pass back to developer if < B

---

## Tips for High Grades

1. **Start with tests** - Write tests first, then code
2. **Log strategically** - Add logging as you code
3. **Document as you go** - Don't wait until the end
4. **Test early** - Test on device frequently
5. **Security first** - Apply RLS from the start
6. **Ask for reviews** - Get feedback early
7. **Use the logger** - Leverage the logging utility
8. **Assert assumptions** - Add assertions for critical paths

---

## Continuous Improvement

Track your grades over time:

- **Sprint 1**: Average grade C (73%)
- **Sprint 2**: Average grade B (82%)
- **Sprint 3**: Average grade A (91%)

Goal: Consistently achieve Grade B or higher!
