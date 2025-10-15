import * as React from 'react';
import { Brain } from 'lucide-react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Brain className="w-full h-full text-blue-500" />
    </div>
  );
};

export default Logo;