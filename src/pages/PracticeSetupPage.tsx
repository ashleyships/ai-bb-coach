import type { StudentProfile } from "../types/StudentProfile";

const initialStudentProfile: StudentProfile = {
  alias: "",
  personality: "",
  church: "",
  healthAndHolidays: "",
  environment: "",
  companion: "",
  sproutSeeking: "",
  additionalInformation: "",
};

function PracticeSetupPage() {
  return (
    <main>
      <h1>Practice Setup</h1>
      <p>Configure your training session.</p>
    </main>
  );
}

export default PracticeSetupPage;
