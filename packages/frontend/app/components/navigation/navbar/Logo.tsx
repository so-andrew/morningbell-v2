'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const Logo = () => {
    const [width, setWidth] = useState(0);
    const updateWidth = () => {
        const newWidth = window.innerWidth;
        setWidth(newWidth);
    };
    useEffect(() => {
        window.addEventListener('resize', updateWidth);
        updateWidth();
    }, []);

    return(
        <>
                <Link href='/' className='flex'>
                    <Image
                        src='/logo512.png'
                        alt='Morningbell logo'
                        width={width < 1024 ? '48' : '64'}
                        height={width < 1024 ? '48' : '64'}
                        className='relative p-1'
                    />
                    <span className='self-center whitespace-nowrap text-xl'>Morningbell</span>
                </Link>

        </>
    );
}

export default Logo;