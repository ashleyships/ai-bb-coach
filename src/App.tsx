import "./App.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PracticeFlowLayout from "./pages/PracticeFlowLayout";
import LessonSimulatorPage from "./pages/LessonSimulatorPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route element={<PracticeFlowLayout />}>
        <Route path="/practice-setup" element={null} />
        <Route path="/lesson-simulator" element={<LessonSimulatorPage />} />
      </Route>
    </Routes>
  );
}

export default App;
