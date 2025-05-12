import React from 'react';

interface DebugModalProps {
  message: string;
}

/**
 * A simple debug modal that always shows on top of everything
 * This is used for debugging UI issues
 */
const DebugModal: React.FC<DebugModalProps> = ({ message }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 10000,
        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}
    >
      {message}
    </div>
  );
};

export default DebugModal;
