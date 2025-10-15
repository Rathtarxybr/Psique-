import * as React from 'react';

interface AnimatedViewProps {
  children: React.ReactNode;
}

const AnimatedView: React.FC<AnimatedViewProps> = ({ children }) => {
  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
};

export default AnimatedView;