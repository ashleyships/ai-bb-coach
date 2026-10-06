import { useState } from "react";
import emblem from "../assets/emblem.jpg";
import "./PracticeSetupPage.css";
import type { StudentProfile } from "../types/StudentProfile";

const initialStudentProfile: StudentProfile = {
  id: "",
  alias: "",
  personality: "",
  church: "",
  healthAndHolidays: "",
  environment: "",
  companion: "",
  sproutSeeking: "",
  additionalInformation: "",
};
const lessonLabels: Record<string, string> = {
  "introduction-to-bible": "Introduction to Bible",
  "tree-by-streams": "Tree by Streams",
  "how-to-meet-god": "How to Meet God",
  "blessings-for-those-who-depend-on-god":
    "Blessings for Those who Depend on God",
  "faith-like-abraham": "Faith like Abraham",
  "why-jesus-is-the-messiah": "Why Jesus is the Messiah",
  "god-and-satan": "God and Satan",
  "four-fields": "Four Fields",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const sectionLabels = {
  intro: "Intro",
  body: "Body",
  conclusion: "Conclusion",
};

type Section = "" | "intro" | "body" | "conclusion";

function getNextStudentAlias(students: StudentProfile[]) {
  const usedAliases = students.map((student) => student.alias);

  let index = 0;

  while (usedAliases.includes(`Student ${String.fromCharCode(65 + index)}`)) {
    index++;
  }

  return `Student ${String.fromCharCode(65 + index)}`;
}

function PracticeSetupPage() {
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(
    initialStudentProfile,
  );

  const [students, setStudents] = useState<StudentProfile[]>([]);

  const [step, setStep] = useState(0);

  const [selectedLesson, setSelectedLesson] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [practiceScope, setPracticeScope] = useState("full");

  const [selectedSection, setSelectedSection] = useState<Section>("");

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  const isEditingStudent = currentStudent.id !== "";

  function handlePreviousStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  const hasCurrentStudentInformation = Object.values(currentStudent).some(
    (value) => value !== "",
  );

  function handleNextStep() {
    if (step === 0 && selectedLesson === "") {
      return;
    }

    if (step === 1) {
      if (isEditingStudent) {
        handleUpdateStudent();
        setStep(step + 1);
        return;
      }

      if (hasCurrentStudentInformation) {
        handleAddStudent();
        setStep(step + 1);
        return;
      }

      if (selectedStudentId !== "") {
        setStep(step + 1);
        return;
      }

      return;
    }

    if (step === 2 && difficulty === "") {
      return;
    }

    if (step === 2 && practiceScope === "section" && selectedSection === "") {
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    }
  }

  function handleAddStudent() {
    setStudents([...students, currentStudent]);

    setCurrentStudent(initialStudentProfile);

    const alias = getNextStudentAlias(students);
    const id = crypto.randomUUID();

    const newStudent: StudentProfile = {
      ...currentStudent,
      id: id,
      alias: alias,
    };

    setStudents([...students, newStudent]);

    setSelectedStudentId(newStudent.id);

    setCurrentStudent(initialStudentProfile);

    setStudents([...students, newStudent]);

    setSelectedStudentId(newStudent.id);
    setCurrentStudent(initialStudentProfile);

    return newStudent;
  }

  function handleUpdateStudent() {
    setStudents(
      students.map((student) =>
        student.id === currentStudent.id ? currentStudent : student,
      ),
    );
  }

  function handleNewStudent() {
    setCurrentStudent(initialStudentProfile);
    setSelectedStudentId("");
  }

  function handleDeleteStudent(studentId: string) {
    setStudents(students.filter((student) => student.id !== studentId));

    if (selectedStudentId === studentId) {
      setSelectedStudentId("");
      setCurrentStudent(initialStudentProfile);
    }
  }

  function handleBeginLesson() {
    console.log("Beginning lesson");
  }

  return (
    <div className="practice-setup-page">
      <aside className="practice-sidebar" aria-label="Practice space sidebar">
        <div className="practice-brand">
          <span className="practice-logo-frame">
            <img src={emblem} alt="SCJ emblem" />
          </span>
          <span>
            BB<small>Speech Training</small>
          </span>
        </div>
        <div className="practice-sidebar-navigation">
          <p>YOUR SPACE</p>
          <span>
            <span aria-hidden="true">⌂</span> Home
          </span>
          <span className="practice-sidebar-current" aria-current="page">
            <span aria-hidden="true">≋</span> Practice
          </span>
          <span>
            <span aria-hidden="true">◷</span> History
          </span>
        </div>
        <div className="practice-sidebar-bottom">
          <p>
            A space to practise.
            <br />
            Room to grow.
          </p>
          <div className="practice-sidebar-profile">
            <span className="practice-profile-avatar" aria-hidden="true">
              A
            </span>
            <span>
              Ashley<small>Teacher</small>
            </span>
          </div>
        </div>
      </aside>
      <main className="practice-main">
        <header className="practice-header">Practice</header>
        <ol
          className="practice-step-progress"
          aria-label="Practice setup progress"
        >
          {["Lesson", "Student", "Settings", "Review"].map((label, index) => (
            <li key={label} aria-current={step === index ? "step" : undefined}>
              {label}
              {index < 3 && <span aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
        <header className="practice-title">
          <p>BEGIN WITH INTENTION</p>
          <h1>
            {
              [
                "What would you like to practise?",
                "Who are you practising with?",
                "Set up your practice",
                "Ready to begin?",
              ][step]
            }
          </h1>
        </header>
        {step === 0 && (
          <section className="practice-lesson-section">
            <h2>Lesson</h2>
            <p>Select the lesson you want to practise.</p>
            <label htmlFor="lesson">Lesson</label>

            <select
              id="lesson"
              value={selectedLesson}
              onChange={(event) => {
                setSelectedLesson(event.target.value);
              }}
            >
              <option value="">Select a lesson</option>
              <option value="introduction-to-bible">
                Introduction to Bible
              </option>
              <option value="tree-by-streams">Tree by Streams</option>
              <option value="how-to-meet-god">How to Meet God</option>
              <option value="blessings-for-those-who-depend-on-god">
                Blessings for Those who Depend on God
              </option>
              <option value="faith-like-abraham">Faith like Abraham</option>
              <option value="why-jesus-is-the-messiah">
                Why Jesus is the Messiah
              </option>
              <option value="god-and-satan">God and Satan</option>
              <option value="four-fields">Four Fields</option>
            </select>
          </section>
        )}
        {step === 1 && (
          <section className="practice-student-section">
            <h2>Student</h2>
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
                      onChange={(event) => {
                        const studentId = event.target.value;

                        setSelectedStudentId(studentId);

                        const student = students.find(
                          (student) => student.id === studentId,
                        );

                        if (student) {
                          setCurrentStudent(student);
                        }
                      }}
                    />

                    {student.alias}

                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      Remove
                    </button>
                  </label>
                ))}
              </div>
            )}
            <p>Configure the student profile.</p>
            <h3>
              {isEditingStudent
                ? `Current Student: ${currentStudent.alias}`
                : `New Student: ${getNextStudentAlias(students)}`}
            </h3>

            <div className="practice-profile-fields">
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
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
              </div>
              <div className="practice-profile-field">
                <label htmlFor="additionalInformation">
                  Additional Information
                </label>
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
              </div>
            </div>
            <div className="practice-profile-actions">
              {isEditingStudent ? (
                <button type="button" onClick={handleUpdateStudent}>
                  Update student
                </button>
              ) : (
                <button type="button" onClick={handleAddStudent}>
                  Add student
                </button>
              )}
              {isEditingStudent && (
                <button type="button" onClick={handleNewStudent}>
                  New student
                </button>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="practice-settings-section">
            <h2>Settings</h2>
            <p>Configure the simulation settings.</p>
            <label htmlFor="difficulty">Difficulty</label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
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
                  onChange={(event) => {
                    setPracticeScope(event.target.value);
                    setSelectedSection("");
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
                  onChange={(event) => {
                    setPracticeScope(event.target.value);
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
                    setSelectedSection(event.target.value as Section);
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
        )}

        {step === 3 && (
          <section className="practice-review-section">
            <h2>Review</h2>
            <p>Review your setup before beginning.</p>

            <p>
              <strong>Lesson:</strong> {lessonLabels[selectedLesson]}
            </p>

            <p>
              <strong>Student:</strong>{" "}
              {selectedStudent ? selectedStudent.alias : "None selected"}
            </p>

            <p>
              <strong>Difficulty:</strong> {difficultyLabels[difficulty]}
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
        )}

        <div className="practice-step-actions">
          {step === 3 ? (
            <button type="button" onClick={handleBeginLesson}>
              Begin Lesson
            </button>
          ) : (
            <button type="button" onClick={handleNextStep}>
              Continue
            </button>
          )}
          <button type="button" onClick={handlePreviousStep}>
            Back
          </button>
        </div>
      </main>
    </div>
  );
}

export default PracticeSetupPage;
