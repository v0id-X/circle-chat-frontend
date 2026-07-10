import React from 'react'
import {Route, Routes,Navigate} from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import {Toaster} from 'react-hot-toast'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const App = () => {
  const {authUser,isCheckingAuth} = useContext(AuthContext)
    return (
    <div className="bg-[url(https://res.cloudinary.com/ddfq88vuc/image/upload/v1775591378/mac-bg_b4jvmk.jpg)] bg-cover bg-center bg-no-repeat h-screen w-screen">
      <Toaster />
      <Routes>
        <Route path='/' element={authUser ? <Home /> : <Navigate to='/login'/>} />
        <Route path='/login' element={!authUser ? <Login /> : <Navigate to='/' />} />
        <Route path='/profile' element={authUser ? <Profile /> : <Navigate to='/login' />} />
      </Routes>
     </div>
  )
  
  
}

export default App
