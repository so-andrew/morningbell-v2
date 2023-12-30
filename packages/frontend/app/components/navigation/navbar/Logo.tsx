'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHomePageState, useRoom } from '@/app/context/providers';

const Logo = () => {
    const { roomID, setRoomID } = useRoom();
    const { pageState, setPageState } = useHomePageState();

    const [width, setWidth] = useState(0);
    const updateWidth = () => {
        const newWidth = window.innerWidth;
        setWidth(newWidth);
    };
    useEffect(() => {
        window.addEventListener('resize', updateWidth);
        updateWidth();
    }, []);

    function handleLandingClick() {
        setPageState('landing');
        setRoomID('');
    }

    return (
        <>
            <Link href='/' className='flex' onClick={handleLandingClick}>
                <Image
                    src='/logo512.png'
                    alt='Morningbell logo'
                    width={width < 1024 ? '48' : '64'}
                    height={width < 1024 ? '48' : '64'}
                    className='relative p-1 hover:animate-wiggle'
                />
                <span className='self-center whitespace-nowrap text-xl text-white'>
                    Morningbell
                </span>
            </Link>
        </>
    );
};

export default Logo;
