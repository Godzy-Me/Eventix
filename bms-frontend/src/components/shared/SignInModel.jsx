import React from 'react'
import { IoClose } from 'react-icons/io5'
import mainWhiteLogo from "../../assets/main-icon-white.png"; // Adjust the path
import { useAuth } from "../../context/AuthContext"
import StepEmail from '../auth/StepEmail';
import StepOTP from '../auth/StepOTP';
import StepAccountCreation from '../auth/StepAccountCreation';

const SignInModel = () => {

    const steps = [
        StepEmail,
        StepOTP,
        StepAccountCreation,
    ];

    const { step, setStep, showModal, toggleModal } = useAuth();

    const Step = steps[step];

    const onNext = () => {
        setStep(step + 1);
    };

    if (!showModal) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-xs'>
            <div className='w-[90%] h-[620px] max-w-xl bg-white rounded-3xl shadow-lg animate-fadeIn overflow-hidden'>

                {/* Top Header Section */}
                <div className='bg-gradient-to-r from-gray-800 to-[#f74565] text-white px-6 py-8 h-[300px] relative items-center flex flex-col justify-center'>
                    {/* Fixed typo (toggleModal) and added missing space before className */}
                    <IoClose onClick={toggleModal} className='absolute top-4 right-4 text-4xl cursor-pointer' />

                    <img
                        src={mainWhiteLogo}
                        alt="bookMyScreen"
                        className='mx-auto h-24 mb-2'
                    />

                    <p className='text-md text-white mt-2'>
                        Where movies meet magic.
                    </p>
                </div>

                <div>
                    <Step onNext={onNext} />   
                </div>
            
            </div>
        </div>
    )
}

export default SignInModel;