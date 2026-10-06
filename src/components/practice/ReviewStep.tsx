import { sectionLabels } from "../../data/practiceOptions";
import type { Section } from "../../types/LessonSession";
import type { StudentProfile } from "../../types/StudentProfile";

type ReviewStepProps = {
  lessonLabel: string | undefined;
  selectedStudent: Readonly<StudentProfile> | undefined;
  difficultyLabel: string | undefined;
  practiceScope: string;
  selectedSection: Section | "";
};

function ReviewStep({
  lessonLabel, selectedStudent, difficultyLabel, practiceScope, selectedSection,
}: ReviewStepProps) {
  return (
    <section className="practice-review-section">
      <h2>Review</h2>
      <p>Review your setup before beginning.</p>

      <p>
        <strong>Lesson:</strong>{" "}
        {lessonLabel}
      </p>

      <p>
        <strong>Student:</strong>{" "}
        {selectedStudent ? selectedStudent.alias : "None selected"}
      </p>

      <p>
        <strong>Difficulty:</strong>{" "}
        {difficultyLabel}
      </p>

      <p>
        <strong>Practice:</strong>{" "}
        {practiceScope === "full" ? "Full lesson" : "Specific section"}
      </p>

      {practiceScope === "section" && selectedSection && (
        <p>
          <strong>Section:</strong> {sectionLabels[selectedSection]}
        </p>
      )}
    </section>
  );
}

export default ReviewStep;
