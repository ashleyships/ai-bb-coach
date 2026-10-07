import { useCallback, useState } from "react";
import type { RealtimeLesson, PracticeFlowContext } from "../types/RealtimeLesson";
import { Outlet, useLocation } from "react-router-dom";
import PracticeSetupPage from "./PracticeSetupPage";

// Keep setup's local profiles and choices mounted during a lesson.
// Returning from the simulator reveals the same Review step.
function PracticeFlowLayout() {
  const location = useLocation();
  const [lessons, setLessons] = useState<Record<string, RealtimeLesson>>({});
  const saveLesson = useCallback((lesson: RealtimeLesson) => {
    setLessons(previous => ({ ...previous, [lesson.session.id]: lesson }));
  }, []);
  const context: PracticeFlowContext = { lessons, saveLesson };
  return (
    <>
      <div hidden={location.pathname !== "/practice-setup"}>
        <PracticeSetupPage />
      </div>
      <Outlet context={context} />
    </>
  );
}

export default PracticeFlowLayout;
