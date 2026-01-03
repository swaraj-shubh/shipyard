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
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/auth' element={<AdminAuth />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path='*' element={<NotFound />} />
        </Routes>

      </Routerz_Hehe>
    </>
  )
}

export default App
