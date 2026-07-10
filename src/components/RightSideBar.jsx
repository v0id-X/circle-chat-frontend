import React, { useState } from 'react'
import assests from '../assets/assets'
import { useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { useEffect } from 'react'
const RightSideBar = () => {

  const {selectedUser,messages} = useContext(ChatContext)
  const {logout,onlineUsers} = useContext(AuthContext)

  const [msgImgs,setMsgImgs] = useState([])

  const handleImageClick = (content) => {
    if (!content) return;
    
    const newTab = window.open();
    if (newTab) { 
      newTab.document.write(`
        <!DOCTYPE html>
        <html style="margin: 0; padding: 0; height: 100%;">
          <head>
            <title>View Media</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #000000; display: flex; align-items: center; justify-content: center; height: 100vh; width: 100vw; overflow: hidden;">
            <img 
              src="${content}" 
              style="max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; box-shadow: 0 0 50px rgba(0,0,0,0.5);" 
              alt="shared media" 
            />
          </body>
        </html>
      `);
      newTab.document.close(); 
    } else {
      alert("Please allow popups to view images");
    }
  };
 
  useEffect(()=>{
    setMsgImgs(
      messages.filter(msg => msg.image).map(msg=>msg.image)
    )
  },[messages])

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser?"max-md:hidden":""}`}>
        <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
            <img src={selectedUser?.profilePic || assests.avatar_icon} alt='' className='w-20 aspect-[1/1] rounded-full' />
            <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
              {onlineUsers.includes(selectedUser._id)&&<p className='w-2 h-2 rounded-full bg-green-500'></p>}
              {selectedUser.fullName}
              </h1>
              <p className='px-10 mx-auto'>{selectedUser.bio}</p>
        </div>

      <hr className='border-[#ffffff50] my-4' />

        <div className='px-5 text-xs'>
            <p>Media</p>
            <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
              {msgImgs.map((url,index)=>(
                  <div key={index} onClick={()=>handleImageClick(url)} className='cursor-pointer rounded'>
                    <img src={url} alt='' className='h-full rounded-md' />
                  </div>
              ))}
            </div>
        </div>

              <button onClick={()=>logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
                Logout
              </button>

    </div>
  )
}

export default RightSideBar
