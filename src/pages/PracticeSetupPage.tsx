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

  const [step, setStep] = useState(0);

  const currentStudentAlias = `Student ${String.fromCharCode(65 + students.length)}`;

  function handlePreviousStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleAddStudent() {
    setStudents([...students, currentStudent]);

    setCurrentStudent(initialStudentProfile);
  }

  return (
    <main>
      {step === 0 && (
        <section>
          <h2>Lesson</h2>
          <p>Select the lesson you want to practise.</p>
        </section>
      )}
      {step === 1 && (
        <section>
          <h2>Student</h2>
          <p>Configure the student profile.</p>
          <h2>Current Student: {currentStudentAlias}</h2>
          <p>Current step: {step}</p>
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
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>Settings</h2>
          <p>Configure the simulation settings.</p>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>Review</h2>
          <p>Review your setup before beginning.</p>
        </section>
      )}

      <button type="button" onClick={() => setStep(step + 1)}>
        Continue
      </button>
      <button type="button" onClick={handlePreviousStep}>
        Back
      </button>
    </main>
  );
}

export default PracticeSetupPage;
