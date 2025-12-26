import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const GRID_SIZE = { rows: 25, cols: 40 };
const CUBE_SIZE = 30;

interface LandingProps {
    onEnter: () => void;
}

const Cube: React.FC<{ mouseX: any, mouseY: any, row: number, col: number }> = ({ mouseX, mouseY, row, col }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [elementX, setElementX] = useState(0);
    const [elementY, setElementY] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setElementX(rect.left + rect.width / 2);
            setElementY(rect.top + rect.height / 2);
        }
    }, []);

    const dx = useTransform(() => elementX - mouseX.get());
    const dy = useTransform(() => elementY - mouseY.get());
    const distance = useTransform(() => Math.sqrt(dx.get() ** 2 + dy.get() ** 2));
    
    const scale = useTransform(distance, [0, 200, 400], [1.5, 1.2, 1]);
    const opacity = useTransform(distance, [0, 200, 350], [0.8, 0.4, 0.1]);
    const rotateX = useTransform(dy, [-200, 200], [15, -15]);
    const rotateY = useTransform(dx, [-200, 200], [-15, 15]);

    return (
        <motion.div
            ref={ref}
            style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                scale,
                opacity,
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                boxShadow: '0 0 5px rgba(212, 175, 55, 0.1)',
            }}
            className="transition-colors duration-500"
        />
    );
};

const Landing: React.FC<LandingProps> = ({ onEnter }) => {
    const mouseX = useMotionValue(Infinity);
    const mouseY = useMotionValue(Infinity);
    const [isExiting, setIsExiting] = useState(false);

    const handleEnter = () => {
        setIsExiting(true);
        setTimeout(onEnter, 1000); // Allow time for exit animation
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="h-screen w-screen bg-black flex items-center justify-center perspective-800"
            onMouseMove={e => { mouseX.set(e.clientX); mouseY.set(e.clientY); }}
            onMouseLeave={() => { mouseX.set(Infinity); mouseY.set(Infinity); }}
        >
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, ease: 'backOut' }}
                    >
                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE.cols}, 1fr)`,
                                gap: '2px',
                                transform: 'rotateX(60deg) scale(1.2)'
                            }}
                        >
                            {Array.from({ length: GRID_SIZE.rows * GRID_SIZE.cols }).map((_, i) => {
                                const row = Math.floor(i / GRID_SIZE.cols);
                                const col = i % GRID_SIZE.cols;
                                return <Cube key={i} mouseX={mouseX} mouseY={mouseY} row={row} col={col} />;
                            })}
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                             <motion.button
                                onClick={handleEnter}
                                className="group relative w-32 h-32 rounded-full border-2 border-cyber-gold/50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-cyber-gold font-mono uppercase text-sm tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                whileHover={{ scale: 1.1, boxShadow: '0 0 50px rgba(212, 175, 55, 0.6)' }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <motion.div 
                                    className="absolute inset-0 border-2 border-cyber-gold rounded-full"
                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                />
                                <span className="z-10">NEXUS</span>
                                <span className="z-10 text-xs opacity-70">Core</span>
                            </motion.button>
                            <p className="mt-8 text-xs text-gray-500 uppercase tracking-[0.3em]">
                                Click Core to Initialize System
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Landing;