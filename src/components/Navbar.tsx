import React from 'react';

const Navbar = () => {
  return (
    <nav className='w-full py-2 flex px-10 justify-between items-center border-b-[0.5px] border-gray-500'>
      <p>TM</p>
      <button className='text-[#8b4fe6] bg-white py-2 px-6 rounded-md text-sm'>
        Connect
      </button>
    </nav>
  );
};

export default Navbar;
