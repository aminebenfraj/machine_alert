import { Routes, Route } from 'react-router-dom';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/roleMangement/AdminDashboard';
import EditUserRoles from './pages/roleMangement/EditUserRoles';
import CreateUser from './pages/roleMangement/CreateUser';
import CreateMachine from './pages/gestionStock/machine/CreateMachine';
import EditMachine from './pages/gestionStock/machine/EditMachine';
import ShowMachines from './pages/gestionStock/machine/ShowMachines';
import  Call from './pages/logistic/call';
import  ProfilePage from './pages/user/profile-page';
import  SettingsPage  from './pages/user/settings-page';



function App() {
  return (
      <AuthProvider>
    <Routes>         
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/edit-user/:license" element={<EditUserRoles />} />
        <Route path="/admin/create-user" element={<CreateUser />} />   
        <Route path="/machines/create" element={<CreateMachine />} />          
        <Route path="machines/edit/:id" element={<EditMachine />} />          
        <Route path="machines" element={<ShowMachines />} />      
        <Route path="/" element={< Call/>} />
        <Route path="/profile" element={< ProfilePage/>} />
        <Route path="/settings" element={< SettingsPage/>} />
    </Routes>
      </AuthProvider>
  );
}

export default App;
