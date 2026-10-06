import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lessonLabels, difficultyLabels } from "../data/practiceOptions";
import {
  isLessonSession,
  type LessonSession,
  type Section,
  type PracticeScope,
} from "../types/LessonSession";
import emblem from "../assets/emblem.jpg";
import "./PracticeSetupPage.css";
import { presetStudents } from "../data/presetStudents";
import type { StudentProfile } from "../types/StudentProfile";
import LessonStep from "../components/practice/LessonStep";
import StudentStep from "../components/practice/StudentStep";
import SettingsStep from "../components/practice/SettingsStep";
import ReviewStep from "../components/practice/ReviewStep";

const initialStudentProfile: StudentProfile = {
  id: "",
  alias: "",
  personality: "",
  mbtiType: "",
  church: "",
  healthAndHolidays: "",
  environment: "",
  companion: "",
  sproutSeeking: "",
  additionalInformation: "",
};
function getNextStudentAlias(students: StudentProfile[]) {
  const usedAliases = students.map((student) => student.alias);

  let index = 0;

  while (usedAliases.includes(`Student ${String.fromCharCode(65 + index)}`)) {
    index++;
  }

  return `Student ${String.fromCharCode(65 + index)}`;
}

function PracticeSetupPage() {
  const navigate = useNavigate();
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(
    initialStudentProfile,
  );

  const [students, setStudents] = useState<StudentProfile[]>([]);

  const [step, setStep] = useState(0);

  const [selectedLesson, setSelectedLesson] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [practiceScope, setPracticeScope] = useState("full");

  const [selectedSection, setSelectedSection] = useState<Section | "">("");

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const selectedPreset = presetStudents.find(
    (student) => student.id === selectedStudentId,
  );
  const selectedStudent =
    selectedPreset ??
    students.find((student) => student.id === selectedStudentId);

  const isEditingStudent = currentStudent.id !== "";

  function handlePreviousStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  const hasCurrentStudentInformation = Object.values(currentStudent).some(
    (value) => value !== "" && value !== undefined,
  );

  function handleNextStep() {
    if (step === 0 && selectedLesson === "") {
      return;
    }

    if (step === 1) {
      if (selectedPreset) {
        setStep(step + 1);
        return;
      }

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

      if (selectedStudent) {
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
    const newStudent: StudentProfile = {
      ...currentStudent,
      id: crypto.randomUUID(),
      alias: getNextStudentAlias(students),
    };

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

  function handlePresetSelect(id: string) {
    setSelectedStudentId(id);
    setCurrentStudent(initialStudentProfile);
  }

  function handleStudentSelect(studentId: string) {
    setSelectedStudentId(studentId);
    const student = students.find((student) => student.id === studentId);
    if (student) {
      setCurrentStudent(student);
    }
  }

  function handleProfileChange<Key extends keyof StudentProfile>(
    field: Key,
    value: StudentProfile[Key],
  ) {
    setCurrentStudent({ ...currentStudent, [field]: value });
  }

  function handlePracticeScopeChange(scope: PracticeScope) {
    setPracticeScope(scope);
    if (scope === "full") {
      setSelectedSection("");
    }
  }

  function handleBeginLesson() {
    if (!selectedStudent) return;

    // Copy the full profile so this attempt never mutates a saved student.
    const session = {
      id: crypto.randomUUID(),
      lessonId: selectedLesson,
      student: { ...selectedStudent },
      difficulty,
      practiceScope,
      ...(practiceScope === "section" ? { selectedSection } : {}),
      messages: [
        {
          id: crypto.randomUUID(),
          role: "student",
          content: "Hi, I'm ready.",
          timestamp: Date.now(),
        },
      ],
    };

    // Also validate at the launch boundary, independently of step navigation.
    if (!isLessonSession(session)) return;
    const completedSession: LessonSession = session;
    navigate("/lesson-simulator", { state: completedSession });
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
          <LessonStep
            selectedLesson={selectedLesson}
            onLessonChange={setSelectedLesson}
          />
        )}
        {step === 1 && (
          <StudentStep
            presetStudents={presetStudents}
            students={students}
            selectedStudentId={selectedStudentId}
            selectedPreset={selectedPreset}
            currentStudent={currentStudent}
            isEditingStudent={isEditingStudent}
            nextStudentAlias={getNextStudentAlias(students)}
            onPresetSelect={handlePresetSelect}
            onStudentSelect={handleStudentSelect}
            onProfileChange={handleProfileChange}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onNewStudent={handleNewStudent}
          />
        )}

        {step === 2 && (
          <SettingsStep
            difficulty={difficulty}
            practiceScope={practiceScope}
            selectedSection={selectedSection}
            onDifficultyChange={setDifficulty}
            onPracticeScopeChange={handlePracticeScopeChange}
            onSectionChange={setSelectedSection}
          />
        )}

        {step === 3 && (
          <ReviewStep
            lessonLabel={
              Object.entries(lessonLabels).find(
                ([id]) => id === selectedLesson,
              )?.[1]
            }
            selectedStudent={selectedStudent}
            difficultyLabel={
              Object.entries(difficultyLabels).find(
                ([id]) => id === difficulty,
              )?.[1]
            }
            practiceScope={practiceScope}
            selectedSection={selectedSection}
          />
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
