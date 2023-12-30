'use client';
import { useRoom } from '../../../context/providers';
import Logo from './Logo';

const Navbar = () => {
    const { roomID } = useRoom();
    return (
        <div className='w-full h-20 bg-gray-800 text-white sticky top-0'>
            <div className='container mx-auto px-4 h-full'>
                <div className='flex justify-between items-center h-full'>
                    <Logo />
                    {roomID && <span>Room Code: {roomID}</span>}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
