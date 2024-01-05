export default function Alert(params: {message: string}) {
    const { message } = params;
    return (
        <div className='bg-red-500 border border-red-400 px-4 py-3 rounded-md text-white'>
            <span className='font-bold'>
                Error
            </span>
            {': '}
            {message}
        </div>
    );

}
 