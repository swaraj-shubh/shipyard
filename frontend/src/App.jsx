import { BrowserRouter as Routerz_Hehe, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react'
import Home from './pages/Home';
import Navbar from './components/navbar';
import './App.css'
import AdminRegister from "./pages/AdminRegister";
import Auth from './pages/Auth';
import AdminAuth from './pages/AdminAuth';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Form from './pages/Form';
import ResponseFormAdmin from './pages/ResponseFormAdmin';
import ResponseFormUser from './pages/ResponseFormUser';
import AdminForms from './pages/AdminForms';
import AdminProfile from './pages/AdminProfile';

function App() {

  return (
    <>
      <Routerz_Hehe >

        <header className="">
          <Navbar />
        </header>
        <Routes className='mt-16'>
          <Route path='/' element={<Home />} />
          <Route path='/auth' element={<Auth />} />
          <Route path='/profile' element={<Profile />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/form/:formId" element={<Form />} />
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/auth' element={<AdminAuth />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/form" element={<AdminForms />} />
          <Route path="/admin/form/:formId/responses" element={<ResponseFormAdmin />} />
          <Route path="/my-submissions" element={<ResponseFormUser />} />
          <Route path='*' element={<NotFound />} />
        </Routes>

      </Routerz_Hehe>
    </>
  )
}

export default App
