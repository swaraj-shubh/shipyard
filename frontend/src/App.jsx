import { BrowserRouter as Routerz_Hehe, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react'
import Home from './pages/Home';
import Navbar from './components/navbar';
import './App.css'
import Auth from './pages/Auth';
import AdminAuth from './pages/AdminAuth';
import NotFound from './pages/NotFound';

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
          <Route path='/admin/auth' element={<AdminAuth />} />
          <Route path='*' element={<NotFound />} />
        </Routes>

      </Routerz_Hehe>
    </>
  )
}

export default App
