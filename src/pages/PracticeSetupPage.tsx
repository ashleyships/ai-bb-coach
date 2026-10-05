import { useState } from "react";
import type { StudentProfile } from "../types/StudentProfile";

const initialStudentProfile: StudentProfile = {
  personality: "",
  church: "",
  healthAndHolidays: "",
  environment: "",
  companion: "",
  sproutSeeking: "",
  additionalInformation: "",
};

function PracticeSetupPage() {
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(
    initialStudentProfile,
  );

  const [students, setStudents] = useState<StudentProfile[]>([]);

  const currentStudentAlias = `Student ${String.fromCharCode(65 + students.length)}`;

  function handleAddStudent() {
    setStudents([...students, currentStudent]);

    setCurrentStudent(initialStudentProfile);
  }

  return (
    <main>
      <h2>Current Student: {currentStudentAlias}</h2>

      <label htmlFor="personality">Personality</label>
      <textarea
        id="personality"
        value={currentStudent.personality}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            personality: event.target.value,
          });
        }}
      />
      <label htmlFor="church">Church</label>
      <textarea
        id="church"
        value={currentStudent.church}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            church: event.target.value,
          });
        }}
      />
      <label htmlFor="healthAndHolidays">Health and Holidays</label>
      <textarea
        id="healthAndHolidays"
        value={currentStudent.healthAndHolidays}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            healthAndHolidays: event.target.value,
          });
        }}
      />
      <label htmlFor="environment">Environment</label>
      <textarea
        id="environment"
        value={currentStudent.environment}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            environment: event.target.value,
          });
        }}
      />
      <label htmlFor="companion">Companion</label>
      <textarea
        id="companion"
        value={currentStudent.companion}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            companion: event.target.value,
          });
        }}
      />
      <label htmlFor="sproutSeeking">Sprout Seeking</label>
      <textarea
        id="sproutSeeking"
        value={currentStudent.sproutSeeking}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            sproutSeeking: event.target.value,
          });
        }}
      />
      <label htmlFor="additionalInformation">Additional Information</label>
      <textarea
        id="additionalInformation"
        value={currentStudent.additionalInformation}
        onChange={(event) => {
          setCurrentStudent({
            ...currentStudent,
            additionalInformation: event.target.value,
          });
        }}
      />
      <button type="button" onClick={handleAddStudent}>
        Add student
      </button>
    </main>
  );
}

export default PracticeSetupPage;
