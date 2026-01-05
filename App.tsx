import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import MeetingDays from './pages/MeetingDays';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Appointment from './pages/Appointment';
import PersonnelForm from './pages/PersonnelForm';
import StudentForm from './pages/StudentForm';
import FoodList from './pages/FoodList';
import Schedule from './pages/Schedule';
import Teachers from './pages/Teachers';
import DynamicFormPage from './pages/DynamicFormPage';
import PublicLayout from './components/PublicLayout';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/meeting-days" element={<MeetingDays />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/apply-personnel" element={<PersonnelForm />} />
          <Route path="/apply-student" element={<StudentForm />} />
          <Route path="/food-list" element={<FoodList />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/form/:slug" element={<DynamicFormPage />} />
          {/* Career redirect */}
          <Route path="/career" element={<Navigate to="/apply-personnel" replace />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
};

export default App;