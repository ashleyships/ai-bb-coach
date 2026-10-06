import { Outlet, useLocation } from "react-router-dom";
import PracticeSetupPage from "./PracticeSetupPage";

// Keep setup's local profiles and choices mounted during a lesson.
// Returning from the simulator reveals the same Review step.
function PracticeFlowLayout() {
  const location = useLocation();
  return (
    <>
      <div hidden={location.pathname !== "/practice-setup"}>
        <PracticeSetupPage />
      </div>
      <Outlet />
    </>
  );
}

export default PracticeFlowLayout;
