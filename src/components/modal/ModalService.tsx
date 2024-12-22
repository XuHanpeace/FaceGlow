import React, { useState, useCallback, createContext, useContext } from 'react';
import Modal from './Modal';


interface ModalContextType {
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);

  const showModal = useCallback((modalContent: React.ReactNode) => {
    setContent(modalContent);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    setContent(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Modal visible={visible} onClose={hideModal}>
        {content}
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 