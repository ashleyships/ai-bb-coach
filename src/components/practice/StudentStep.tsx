import { mbtiTypes, type StudentProfile } from "../../types/StudentProfile";

type StudentStepProps = {
  presetStudents: readonly Readonly<StudentProfile>[];
  students: StudentProfile[];
  selectedStudentId: string;
  selectedPreset: Readonly<StudentProfile> | undefined;
  currentStudent: StudentProfile;
  isEditingStudent: boolean;
  nextStudentAlias: string;
  onPresetSelect: (id: string) => void;
  onStudentSelect: (id: string) => void;
  onProfileChange: <Key extends keyof StudentProfile>(field: Key, value: StudentProfile[Key]) => void;
  onAddStudent: () => void;
  onUpdateStudent: () => void;
  onDeleteStudent: (id: string) => void;
  onNewStudent: () => void;
};

function StudentStep({
  presetStudents, students, selectedStudentId, selectedPreset, currentStudent,
  isEditingStudent, nextStudentAlias, onPresetSelect, onStudentSelect,
  onProfileChange, onAddStudent, onUpdateStudent, onDeleteStudent, onNewStudent,
}: StudentStepProps) {
  return (
    <section className="practice-student-section">
      <h2>Student</h2>
      <p>
        Use a preset, choose a saved student, or create a new profile.
      </p>
      <div className="practice-preset-students">
        <h3>Preset students</h3>
        <p className="practice-profile-help">
          Generic starting points for practice when you do not have a
          specific student in mind.
        </p>
        <div className="practice-preset-grid">
          {presetStudents.map((preset) => (
            <label className="practice-student-choice" key={preset.id}>
              <input
                type="radio"
                name="selected-student"
                value={preset.id}
                checked={selectedStudentId === preset.id}
                onChange={() => onPresetSelect(preset.id)}
              />
              <span>
                <strong>{preset.alias}</strong>
                <small>{preset.personality}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
      {students.length > 0 && (
        <div className="practice-saved-students">
          <h3>Saved students</h3>

          {students.map((student) => (
            <label className="practice-student-choice" key={student.id}>
              <input
                type="radio"
                name="selected-student"
                value={student.id}
                checked={selectedStudentId === student.id}
                onChange={(event) => onStudentSelect(event.target.value)}
              />

              {student.alias}

              <button
                type="button"
                onClick={() => onDeleteStudent(student.id)}
              >
                Remove
              </button>
            </label>
          ))}
        </div>
      )}
      {selectedPreset ? (
        <div className="practice-selected-preset">
          <h3>Selected: {selectedPreset.alias}</h3>
          <p>
            You can continue with this built-in profile, choose a saved
            student, or create a new one.
          </p>
          <button type="button" onClick={onNewStudent}>
            New student
          </button>
        </div>
      ) : (
        <>
          <p>Configure the student profile.</p>
          <h3>
            {isEditingStudent
              ? `Current Student: ${currentStudent.alias}`
              : `New Student: ${nextStudentAlias}`}
          </h3>

          <div className="practice-profile-fields">
            <div className="practice-profile-field">
              <label htmlFor="personality">Personality</label>
              <textarea
                id="personality"
                value={currentStudent.personality}
                onChange={(event) => {
                  onProfileChange("personality", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="mbtiType">MBTI Type</label>
              <select
                id="mbtiType"
                value={currentStudent.mbtiType ?? ""}
                aria-describedby="mbti-help"
                onChange={(event) => {
                  const value = event.target.value;
                      const mbtiType = mbtiTypes.find((type) => type === value) ?? "";
                      onProfileChange("mbtiType", mbtiType);
                }}
              >
                <option value="">Not provided</option>
                {mbtiTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p id="mbti-help" className="practice-profile-help">
                Optional. Choose a known type only; the full profile
                remains the primary guide.
              </p>
            </div>
            <div className="practice-profile-field">
              <label htmlFor="church">Church</label>
              <textarea
                id="church"
                value={currentStudent.church}
                onChange={(event) => {
                  onProfileChange("church", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="healthAndHolidays">
                Health and Holidays
              </label>
              <textarea
                id="healthAndHolidays"
                value={currentStudent.healthAndHolidays}
                onChange={(event) => {
                  onProfileChange("healthAndHolidays", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="environment">Environment</label>
              <textarea
                id="environment"
                value={currentStudent.environment}
                onChange={(event) => {
                  onProfileChange("environment", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="companion">Companion</label>
              <textarea
                id="companion"
                value={currentStudent.companion}
                onChange={(event) => {
                  onProfileChange("companion", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="sproutSeeking">Sprout / Seeking</label>
              <textarea
                id="sproutSeeking"
                value={currentStudent.sproutSeeking}
                onChange={(event) => {
                  onProfileChange("sproutSeeking", event.target.value);
                }}
              />
            </div>
            <div className="practice-profile-field">
              <label htmlFor="additionalInformation">
                Additional Information
              </label>
              <textarea
                id="additionalInformation"
                value={currentStudent.additionalInformation}
                onChange={(event) => {
                  onProfileChange("additionalInformation", event.target.value);
                }}
              />
            </div>
          </div>
          <div className="practice-profile-actions">
            {isEditingStudent ? (
              <button type="button" onClick={onUpdateStudent}>
                Update student
              </button>
            ) : (
              <button type="button" onClick={onAddStudent}>
                Add student
              </button>
            )}
            {isEditingStudent && (
              <button type="button" onClick={onNewStudent}>
                New student
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default StudentStep;
