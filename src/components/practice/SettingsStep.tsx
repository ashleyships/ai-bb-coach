import type { PracticeScope, Section } from "../../types/LessonSession";

type SettingsStepProps = {
  difficulty: string;
  practiceScope: string;
  selectedSection: Section | "";
  onDifficultyChange: (difficulty: string) => void;
  onPracticeScopeChange: (scope: PracticeScope) => void;
  onSectionChange: (section: Section | "") => void;
};

function SettingsStep({
  difficulty, practiceScope, selectedSection,
  onDifficultyChange, onPracticeScopeChange, onSectionChange,
}: SettingsStepProps) {
  return (
    <section className="practice-settings-section">
      <h2>Settings</h2>
      <p>Configure the simulation settings.</p>
      <label htmlFor="difficulty">Difficulty</label>

      <select
        id="difficulty"
        value={difficulty}
        onChange={(event) => {
          onDifficultyChange(event.target.value);
        }}
      >
        <option value="">Select difficulty</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <fieldset>
        <legend>Practice scope</legend>

        <label>
          <input
            type="radio"
            name="practice-scope"
            value="full"
            checked={practiceScope === "full"}
            onChange={() => {
              onPracticeScopeChange("full");
            }}
          />
          Full lesson
        </label>

        <label>
          <input
            type="radio"
            name="practice-scope"
            value="section"
            checked={practiceScope === "section"}
            onChange={() => {
              onPracticeScopeChange("section");
            }}
          />
          Specific section
        </label>
      </fieldset>
      {practiceScope === "section" && (
        <div>
          <label htmlFor="lesson-section">Section</label>

          <select
            id="lesson-section"
            value={selectedSection}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || value === "intro" || value === "body" || value === "conclusion") {
                onSectionChange(value);
              }
            }}
          >
            <option value="">Select a section</option>
            <option value="intro">Intro</option>
            <option value="body">Body</option>
            <option value="conclusion">Conclusion</option>
          </select>
        </div>
      )}
    </section>
  );
}

export default SettingsStep;
