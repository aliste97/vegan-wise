import { Leaf } from 'lucide-react';
import React from 'react';

const Header = () => {
  return (
    <header className="py-5 px-4 md:px-8 bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Leaf className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">VeganWise</h1>
      </div>
    </header>
  );
};

export default Header;
