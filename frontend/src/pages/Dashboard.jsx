import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import PrincipalDashboard from "./PrincipalDashboard";

const Dashboard = ({ user, onLogout, onNavigate, onUpdateUser }) => {
  if (user?.role === "principal") {
    return (
      <PrincipalDashboard 
        user={user} 
        onLogout={onLogout} 
        onNavigate={onNavigate} 
        onUpdateUser={onUpdateUser} 
      />
    );
  }

  if (user?.role === "teacher") {
    return (
      <TeacherDashboard 
        user={user} 
        onLogout={onLogout} 
        onNavigate={onNavigate} 
        onUpdateUser={onUpdateUser} 
      />
    );
  }

  return (
    <StudentDashboard 
      user={user} 
      onLogout={onLogout} 
      onNavigate={onNavigate} 
      onUpdateUser={onUpdateUser} 
    />
  );
};

export default Dashboard;
