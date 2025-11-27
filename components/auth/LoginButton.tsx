import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface LoginButtonProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onSuccess, onError }) => {
    return (
        <div className="flex items-center">
            <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                useOneTap
                theme="filled_black"
                shape="pill"
                size="medium"
                text="signin_with"
            />
        </div>
    );
};
