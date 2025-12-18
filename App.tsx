import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAppStore } from './stores/useAppStore';
import { ViewState } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import LockScreen from './components/LockScreen';
import BootSequence from './components/BootSequence';
import ParticleBackground from './components/ParticleBackground';
import { LayoutDashboard, Package, ShoppingCart, Users, PieChart, FileText, Settings as SettingsIcon, Crosshair, X, CheckCircle, AlertTriangle, Info, Globe, Loader2, Gamepad2, User, Briefcase, Star, ArrowLeft } from 'lucide-react';

// --- LAZY LOAD COMPONENTS ---
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Stock = React.lazy(() => import('./components/Stock'));
const POS = React.lazy(() => import('./components/POS'));
const Customers = React.lazy(() => import('./components/Customers'));
const Analytics = React.lazy(() => import('./components/Analytics'));
const Ledger = React.lazy(() => import('./components/Ledger'));
const Settings = React.lazy(() => import('./components/Settings'));
const ProfitPlanner = React.lazy(() => import('./components/ProfitPlanner'));
const Network = React.lazy(() => import('./components/Network'));
const MarketGame = React.lazy(() => import('./components/MarketGame'));
const DealerProfile = React.lazy(() => import('./components/DealerProfile'));
const ThemeWizard = React.lazy(() => import('./components/ThemeWizard'));
const CustomerPortal = React.lazy(() => import('./components/CustomerPortal'));
const ChatOverlay = React.lazy(() => import('./components/ChatOverlay'));
const Missions = React.lazy(() => import('./components/Missions'));
const SkillTree = React.lazy(() => import('./components/SkillTree'));

// --- LOADING FALLBACK ---
const LoadingScreen = () => (
    <div className="h-full w-full flex flex-col items-center justify-center opacity-50">
        <Loader2 size={48} className="text-cyber-gold animate-spin mb-4"/>
        <div className="text-cyber-gold font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Loading Module...</div>
    </div>
);

// --- TOAST COMPONENT ---
const ToastContainer = () => {
    const notifications = useAppStore(state => state.notifications);
    const removeNotification = useAppStore(state => state.removeNotification);

    return (
        <div className="fixed top-4 right-4 z-[200] space-y-2 pointer-events-none">
            {notifications.map(n => (
                <div 
                    key={n.id} 
                    className={`pointer-events-auto min-w-[300px] p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 animate-slide-in transition-all ${
                        n.type === 'SUCCESS' ? 'bg-cyber-green/10 border-cyber-green text-white' :
                        n.type === 'ERROR' ? 'bg-red-500/10 border-red-500 text-white' :
                        n.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500 text-white' :
                        'bg-cyber-panel border-white/20 text-white'
                    }`}
                >
                    <div className={`mt-0.5 ${
                         n.type === 'SUCCESS' ? 'text-cyber-green' :
                         n.type === 'ERROR' ? 'text-red-500' :
                         n.type === 'WARNING' ? 'text-yellow-500' : 'text-cyber-purple'
                    }`}>
                        {n.type === 'SUCCESS' && <CheckCircle size={18} />}
                        {n.type === 'ERROR' && <AlertTriangle size={18} />}
                        {n.type === 'WARNING' && <AlertTriangle size={18} />}
                        {n.type === 'INFO' && <Info size={18} />}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium leading-tight">{n.message}</p>
                    </div>
                    <button onClick={() => removeNotification(n.id)} className="text-white/50 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    )
}

const navItems = [
  { view: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'PROFILE', label: 'Profile', icon: User },
  { view: 'MISSIONS', label: 'Contracts', icon: Briefcase },
  { view: 'SKILLS', label: 'Skills', icon: Star },
  { view: 'STOCK', label: 'Inventory', icon: Package },
  { view: 'POS', label: 'POS', icon: ShoppingCart },
  { view: 'CUSTOMERS', label: 'CRM', icon: Users },
  { view: 'PLANNER', label: 'Planner', icon: Crosshair },
  { view: 'MARKET_GAME', label: 'Trade', icon: Gamepad2 },
  { view: 'NETWORK', label: 'Network', icon: Globe },
  { view: 'ANALYTICS', label: 'Analytics', icon: PieChart },
  { view: 'LEDGER', label: 'Ledger', icon: FileText },
  { view: 'SETTINGS', label: 'Settings', icon: SettingsIcon },
];

const AppContent: React.FC = () => {
  const [entryMode, setEntryMode] = useState<'LANDING' | 'OPERATOR' | 'CUSTOMER'>('LANDING');
  const [ghostChannelId, setGhostChannelId] = useState<string | null>(null);
  
  const [focusedView, setFocusedView] = useState<ViewState | null>(null);
  const [hubRotation, setHubRotation] = useState({ y: 0, x: 0 });
  
  const { 
      settings, financials, sales, inventoryTerms, highFidelityMode, 
      storeChannelId, chatMessages, sendManagerMessage, clearChat
  } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showThemeWizard, setShowThemeWizard] = useState(false);
  
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'ghost' && urlParams.get('channel')) {
          setGhostChannelId(urlParams.get('channel'));
          setEntryMode('CUSTOMER');
      }
  }, []);

  useEffect(() => {
      if (entryMode === 'OPERATOR' && !settings.themeConfig && process.env.API_KEY) {
          setShowThemeWizard(true);
      }
  }, [settings.themeConfig, entryMode]);

  useEffect(() => {
    if (entryMode !== 'OPERATOR') return;
    if (!settings.appPin) {
        setIsAuthenticated(true);
    } else {
        setIsAuthenticated(false);
    }
  }, [settings.appPin, entryMode]);

  const moodStyle = useMemo(() => {
      if (entryMode !== 'OPERATOR') return '';
      const liquidity = financials.cashOnHand + financials.bankBalance;
      const recentProfit = sales.slice(-10).reduce((acc, s) => acc + s.profit, 0);
      if (recentProfit < -200 || liquidity < 100) return 'status-critical';
      if (recentProfit > 500) return 'status-thriving';
      return '';
  }, [financials, sales, entryMode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();
    const yRotation = (clientX - width / 2) / width * 30; // Rotate up to 30deg
    const xRotation = -(clientY - height / 2) / height * 15;
    setHubRotation({ y: yRotation, x: xRotation });
  };
  
  const renderView = (view: ViewState) => {
    switch (view) {
      case 'DASHBOARD': return <Dashboard onNavigate={setFocusedView} />;
      case 'STOCK': return <Stock />;
      case 'POS': return <POS />;
      case 'CUSTOMERS': return <Customers />;
      case 'ANALYTICS': return <Analytics />;
      case 'LEDGER': return <Ledger />;
      case 'SETTINGS': return <Settings />;
      case 'PLANNER': return <ProfitPlanner onNavigateToPOS={() => setFocusedView('POS')} />;
      case 'NETWORK': return <Network />;
      case 'MARKET_GAME': return <MarketGame />;
      case 'PROFILE': return <DealerProfile />;
      case 'MISSIONS': return <Missions />;
      case 'SKILLS': return <SkillTree />;
      default: return <div>Unknown View</div>;
    }
  };

  if (entryMode === 'LANDING') {
      return <BootSequence onSelectOperator={() => setEntryMode('OPERATOR')} onConnectGhost={(id) => { setGhostChannelId(id); setEntryMode('CUSTOMER'); }}/>;
  }
  if (entryMode === 'CUSTOMER' && ghostChannelId) {
      return <Suspense fallback={<LoadingScreen/>}><CustomerPortal channelId={ghostChannelId} inventoryTerms={inventoryTerms} /></Suspense>;
  }
  if (entryMode === 'OPERATOR' && !isAuthenticated && settings.appPin) {
      return <LockScreen correctPin={settings.appPin} onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`h-screen w-screen bg-[#050505] overflow-hidden ${moodStyle}`} onMouseMove={handleMouseMove}>
      {highFidelityMode && <ParticleBackground />}
      <ToastContainer />
      <Suspense fallback={null}><ChatOverlay messages={chatMessages} onSendMessage={sendManagerMessage} onClearChat={clearChat} channelId={storeChannelId}/></Suspense>
      
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: hubRotation.x, rotateY: hubRotation.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 2 }}
      >
        <motion.div
            className="w-full h-full absolute"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{
              transform: focusedView ? 'translateZ(-800px) rotateY(15deg)' : 'translateZ(0px) rotateY(0deg)',
              opacity: focusedView ? 0 : 1
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
        >
          {navItems.map((item, i) => {
            const angle = (i / (navItems.length - 1) - 0.5) * 160;
            return (
              <motion.div
                key={item.view}
                className="absolute w-[280px] h-[150px] -ml-[140px] -mt-[75px] top-1/2 left-1/2"
                style={{ transformStyle: 'preserve-3d' }}
                initial={{ transform: `rotateY(${angle}deg) translateZ(500px) translateY(100px) `}}
                animate={{ transform: `rotateY(${angle}deg) translateZ(500px) translateY(0px)`}}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.05 }}
              >
                <motion.div
                  className="w-full h-full bg-cyber-panel border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer"
                  whileHover={{
                    transform: 'translateZ(30px) scale(1.05)',
                    borderColor: 'rgba(212, 175, 55, 0.8)',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
                  }}
                  onClick={() => setFocusedView(item.view)}
                >
                  <item.icon className="text-cyber-gold" size={32}/>
                  <span className="text-white font-bold text-sm uppercase tracking-widest">{item.label}</span>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {focusedView && (
          <motion.div
            className="absolute inset-0 bg-cyber-panel z-50 flex flex-col"
            initial={{ opacity: 0, transform: 'translateZ(1000px) scale(0.8)' }}
            animate={{ opacity: 1, transform: 'translateZ(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateZ(-1000px) scale(0.8)'}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
          >
            <div className="p-4 bg-black/50 border-b border-white/10 flex items-center gap-4">
              <button
                onClick={() => setFocusedView(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-white font-bold uppercase tracking-widest">{focusedView.replace('_', ' ')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
              <Suspense fallback={<LoadingScreen />}>
                {renderView(focusedView)}
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const initializeStore = useAppStore(state => state.initialize);

  useEffect(() => {
      initializeStore();
  }, [initializeStore]);

  return <AppContent />;
};

export default App;