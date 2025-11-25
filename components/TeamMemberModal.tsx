'use client';

import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  description: string;
  ttl: string;
  alamat: string;
  motto: string;
}

interface TeamMemberModalProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, isOpen, onClose }) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {member.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="mt-2">
              <div className="text-center mb-4">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-48 h-48 object-cover rounded-lg mx-auto"
                />
              </div>
              
              <h6 className="font-bold text-blue-600 mb-4">{member.position}</h6>
              
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-bold w-32 flex-shrink-0">{t('memberModal.name')}</span>
                  <span className="mx-2">:</span>
                  <span>{member.name}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-32 flex-shrink-0">{t('memberModal.birthplace')}</span>
                  <span className="mx-2">:</span>
                  <span>{member.ttl}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-32 flex-shrink-0">{t('memberModal.address')}</span>
                  <span className="mx-2">:</span>
                  <span>{member.alamat}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-32 flex-shrink-0">{t('memberModal.motto')}</span>
                  <span className="mx-2">:</span>
                  <span>{member.motto}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              onClick={onClose}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;