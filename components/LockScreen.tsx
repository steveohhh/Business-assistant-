import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';

interface LockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ correctPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
      if (input === correctPin) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 400);
      }
    }
  }, [input, correctPin, onUnlock]);

  const handlePress = (num: number) => {
    if (input.length < 4 && !success) {
      setInput(prev => prev + num.toString());
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-cyber-panel opacity-90"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Header Icon */}
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-8 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
          success ? 'border-cyber-green bg-cyber-green/20 text-cyber-green shadow-cyber-green/40' : 
          error ? 'border-cyber-red bg-cyber-red/20 text-cyber-red shadow-cyber-red/40 animate-pulse' : 
          'border-cyber-gold bg-cyber-gold/10 text-cyber-gold shadow-cyber-gold/20'
        }`}>
          {success ? <Unlock size={40} /> : <Lock size={40} />}
        </div>

        <h2 className="text-white font-bold text-xl tracking-[0.3em] mb-8 uppercase text-center">
          {error ? 'Access Denied' : success ? 'Access Granted' : 'Security Clearance'}
        </h2>

        {/* Dots */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border border-white/30 transition-all duration-200 ${
                input.length > i 
                  ? success ? 'bg-cyber-green border-cyber-green scale-110' 
                  : error ? 'bg-cyber-red border-cyber-red' 
                  : 'bg-cyber-gold border-cyber-gold scale-110 shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePress(num)}
              className="aspect-square rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyber-gold/50 active:scale-95 transition-all flex items-center justify-center text-2xl font-mono text-white font-bold shadow-lg"
            >
              {num}
            </button>
          ))}
          <div className="aspect-square"></div>
          <button
            onClick={() => handlePress(0)}
            className="aspect-square rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyber-gold/50 active:scale-95 transition-all flex items-center justify-center text-2xl font-mono text-white font-bold shadow-lg"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-95 transition-all"
          >
            <Delete size={24} />
          </button>
        </div>

        <p className="mt-12 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
            System Secured • V2.5.0
        </p>

      </div>
    </div>
  );
};

export default LockScreen;