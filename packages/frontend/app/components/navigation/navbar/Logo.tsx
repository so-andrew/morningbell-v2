'use client';
import { useHomePageState, useWs } from '@/app/context/providers';
import Image from 'next/image';
import Link from 'next/link';
//import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Logo = () => {
    //const { roomID, setRoomID } = useRoom();
    //const { userID, setUserID } = useUser();
    const { setPageState } = useHomePageState();
    const { ready } = useWs();
    //const pathname = usePathname();

    // const [sendLeaveMessage, setSendLeaveMessage] = useState(false);
    // const [oldRoomID, setOldRoomID] = useState('');
    // const re = /\/rooms\/(\w+)/;

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
        // const url = `${pathname}`;
        // const found = url.match(re);
        // if(found){
        //     setSendLeaveMessage(true);
        //     setOldRoomID(found[1]);
        //     console.log(found[1], userID);
        //     send(JSON.stringify({
        //         type: 'leave',
        //         params: {
        //             code: found[1],
        //             userID: userID,
        //         }
        //     }));
        //     setRoomID('');
        // }

        setPageState('landing');
    }

    // This doesn't work, also it probably shouldn't even be here
    // Maybe move this part to the landing page with state shared using context? idk

    // useEffect(() => {
    //     if(ready){
    //         console.log(oldRoomID, userID);
    //         send(JSON.stringify({
    //             type: 'leave',
    //             params: {
    //                 code: oldRoomID,
    //                 userID: userID,
    //             }
    //         }));
    //         setRoomID('');
    //     }
    // }, [ready]);

    return (
        <>
            <Link href='/' className='flex' onClick={handleLandingClick}>
                <Image
                    src='/logo512.png'
                    alt='Morningbell logo'
                    width={width < 1024 ? '48' : '64'}
                    height={width < 1024 ? '48' : '64'}
                    className='hover:animate-wiggle relative p-1'
                />
                <span
                    className={`self-center whitespace-nowrap text-xl ${
                        ready ? 'text-green-600' : 'text-red-500'
                    }`}
                >
                    Morningbell
                </span>
            </Link>
        </>
    );
};

export default Logo;
