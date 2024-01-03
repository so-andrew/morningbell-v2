export default function UserList(UserListData: {
    userList: Array<Array<string>>;
    userID: string;
    username: string;
    buzzedUser: string;
    host: string;
}) {
    const { userList, userID, username, buzzedUser, host } = UserListData;

    function getUsernameFromID(userID: string): string {
        for (const [id, name] of userList) {
            if (id === userID) return name;
        }
        return '';
    }

    //console.log(userList);

    return (
        <section className='flex flex-col flex-wrap items-center'>
            <h2 className='text-white text-center text-xl font-bold m-6 mx-auto'>
                Players
            </h2>
            <ul className='list-none text-white text-left py-2 min-w-fit w-3/5 lg:max-w-lg'>
                <li
                    className={`${
                        userID === buzzedUser
                            ? 'bg-red-500 hover:bg-red-700'
                            : 'bg-[#404f5f] hover:bg-blue-500'
                    } outline outline-1 outline-zinc-300/50 rounded-md px-6 py-2 mb-2`}
                >
                    <b>{username}</b>{' '}
                    <span className='text-gray-400'>(You)</span>
                </li>
                {buzzedUser &&
                    buzzedUser.length > 0 &&
                    buzzedUser !== userID && (
                        <li className='bg-red-500 hover:bg-red-700 outline outline-1 outline-zinc-300/50 rounded-md px-6 py-2 mb-2'>
                            <b>{getUsernameFromID(buzzedUser)}</b>
                        </li>
                    )}
                {buzzedUser &&
                    buzzedUser.length > 0 &&
                    userList
                        .filter(
                            (element) =>
                                element[0] !== userID &&
                                element[0] !== buzzedUser
                        )
                        .sort()
                        .map((element) => {
                            return (
                                <li
                                    key={element[0]}
                                    className='bg-[#404f5f] hover:bg-blue-500 outline outline-1 outline-zinc-300/50 rounded-md px-6 py-2 mb-2'
                                >
                                    <b>{element[1]}</b>
                                    {element[0] === host && (
                                        <span className='text-gray-400'> (Host)</span>
                                    )}
                                </li>
                            );
                        })}
                {!buzzedUser &&
                    userList
                        .filter((element) => element[0] !== userID)
                        .sort()
                        .map((element) => {
                            return (
                                <li
                                    key={element[0]}
                                    className='bg-[#404f5f] hover:bg-blue-500 outline outline-1 outline-zinc-300/50 rounded-md px-6 py-2 mb-2'
                                >
                                    <b>{element[1]}</b>
                                    {element[0] === host && (
                                        <span className='text-gray-400'> (Host)</span>
                                    )}
                                </li>
                            );
                        })}
            </ul>
        </section>
    );
}
