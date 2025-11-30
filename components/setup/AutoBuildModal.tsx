import React, { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BoltIcon } from '../icons/BoltIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface AutoBuildModalProps {
    progress: string;
    steps: Record<string, boolean>;
    onClose: () => void;
    error?: string | null;
    timeRemaining?: number | null;
    onCancel?: () => void;
}

export const AutoBuildModal: React.FC<AutoBuildModalProps> = ({ progress, steps, onClose, error, timeRemaining, onCancel }) => {
    const { t } = useLanguage();
    const isComplete = progress === 'complete';
    const isError = !!error;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6">
                <div className="text-center">
                    <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full border mb-4 relative ${isError ? 'bg-red-500/20 border-red-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
                        {isError ? <TrashIcon className="w-8 h-8 text-red-400" /> : isComplete ? <CheckIcon className="w-8 h-8 text-emerald-400" /> : <BoltIcon className="w-8 h-8 text-indigo-400 animate-pulse" />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">{isError ? t('common.failed') : t('setup.autoBuild.modalTitle')}</h2>
                    {typeof timeRemaining === 'number' && !isComplete && !isError && (
                        <p className="text-sm text-indigo-300 mt-2 font-mono animate-pulse">
                            ~ {timeRemaining}s remaining
                        </p>
                    )}
                </div>
                {isError ? <div className="bg-red-900/30 text-red-200 p-4 rounded-lg border border-red-800 text-sm">{error}</div> : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-700"> {steps.basic ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : <SpinnerIcon className="w-5 h-5 text-indigo-400" />} <span className={steps.basic ? "text-emerald-400" : "font-medium"}>{t('setup.autoBuild.stepBasic')}</span> </div>
                        <div className="flex items-center gap-3 text-gray-700"> {steps.core ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.basic ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />)} <span className={steps.core ? "text-emerald-400" : (steps.basic ? "font-medium" : "text-gray-500")}>{t('setup.autoBuild.stepCore')}</span> </div>
                        <div className="flex items-center gap-3 text-gray-700"> {steps.world ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.core ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />)} <span className={steps.world ? "text-emerald-400" : (steps.core ? "font-medium" : "text-gray-500")}>{t('setup.autoBuild.stepWorld')}</span> </div>
                        <div className="flex items-center gap-3 text-gray-700"> {steps.relations ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.world ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />)} <span className={steps.relations ? "text-emerald-400" : (steps.world ? "font-medium" : "text-gray-500")}>{t('setup.autoBuild.stepRelations')}</span> </div>
                        <div className="flex items-center gap-3 text-gray-700"> {steps.arc ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.relations ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />)} <span className={steps.arc ? "text-emerald-400" : (steps.relations ? "font-medium" : "text-gray-500")}>{t('setup.autoBuild.stepArc')}</span> </div>
                        <div className="flex items-center gap-3 text-gray-700"> {steps.tone ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.arc ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />)} <span className={steps.tone ? "text-emerald-400" : (steps.arc ? "font-medium" : "text-gray-500")}>{t('setup.autoBuild.stepTone')}</span> </div>
                    </div>
                )}
                {!isComplete && !isError && onCancel && (
                    <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={onCancel} className="w-full font-bold py-3 px-6 rounded-lg transition-colors border border-gray-300 text-gray-600 hover:text-white hover:bg-gray-100 hover:border-slate-500">
                            {t('common.cancel')}
                        </button>
                    </div>
                )}
                {(isComplete || isError) && (
                    <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={onClose} className={`w-full font-bold py-3 px-6 rounded-lg transition-colors shadow-lg ${isError ? 'bg-gray-100 hover:bg-slate-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}>
                            {isError ? t('common.cancel') : t('common.confirm')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
