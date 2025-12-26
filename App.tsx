import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAppStore } from './stores/useAppStore';
import { ViewState } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import LockScreen from './components/LockScreen';
import Landing from './components/Landing';
import ParticleBackground from './components/ParticleBackground';
import { 
  X, CheckCircle, AlertTriangle, Info, Loader2,
  LayoutDashboard, User, Briefcase, Star, Package, ShoppingCart, 
  Users, Gamepad2, Globe, PieChart, FileText, Settings as SettingsIcon,
  Zap, Dices, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

// --- LAZY COMPONENTS ---
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
const Missions = React.lazy(() => import('./components/Missions'));
const SkillTree = React.lazy(() => import('./components/SkillTree'));
const CustomerPortal = React.lazy(() => import('./components/CustomerPortal'));
const ChatOverlay = React.lazy(() => import('./components/ChatOverlay'));
const Casino = React.lazy(() => import('./components/Casino'));

const LoadingScreen = () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
        <Loader2 size={48} className="text-cyber-gold animate-spin mb-4"/>
        <div className="text-cyber-gold font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Node Sync...</div>
    </div>
);

const ToastContainer = () => {
    const notifications = useAppStore(state => state.notifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    
    return (
        <div className="fixed top-6 right-6 z-[200] space-y-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map(n => (
                    <motion.div 
                        key={n.id} 
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        layout
                        className={`pointer-events-auto min-w-[320px] p-5 rounded-2xl border backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start gap-4 ${
                            n.type === 'SUCCESS' ? 'bg-cyber-green/10 border-cyber-green/30 text-white' :
                            n.type === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-white' :
                            n.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30 text-white' :
                            'bg-cyber-panel border-white/20 text-white'
                        }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {n.type === 'SUCCESS' && <CheckCircle size={20} className="text-cyber-green" />}
                            {n.type === 'ERROR' && <AlertTriangle size={20} className="text-red-500" />}
                            {n.type === 'WARNING' && <AlertTriangle size={20} className="text-yellow-500" />}
                            {n.type === 'INFO' && <Info size={20} className="text-cyber-purple" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold leading-tight tracking-tight">{n.message}</p>
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="text-white/30 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

const AppContent: React.FC = () => {
  const [entryMode, setEntryMode] = useState<'LANDING' | 'OPERATOR' | 'CUSTOMER'>('LANDING');
  const [ghostChannelId, setGhostChannelId] = useState<string | null>(null);
  const [focusedView, setFocusedView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // GRANULAR SELECTORS TO FIX ERROR 185
  const appPin = useAppStore(state => state.settings.appPin);
  const cashOnHand = useAppStore(state => state.financials.cashOnHand);
  const inventoryTerms = useAppStore(state => state.inventoryTerms);
  const highFidelityMode = useAppStore(state => state.highFidelityMode);
  const storeChannelId = useAppStore(state => state.storeChannelId);
  const chatMessages = useAppStore(state => state.chatMessages);
  const sendManagerMessage = useAppStore(state => state.sendManagerMessage);
  const clearChat = useAppStore(state => state.clearChat);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'ghost' && urlParams.get('channel')) {
          setGhostChannelId(urlParams.get('channel'));
          setEntryMode('CUSTOMER');
      }
  }, []);

  useEffect(() => {
    if (entryMode === 'OPERATOR') {
        setIsAuthenticated(!appPin);
    }
  }, [appPin, entryMode]);

  const CurrentView = useMemo(() => {
    switch (focusedView) {
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
      case 'CASINO': return <Casino />;
      default: return <Dashboard onNavigate={setFocusedView} />;
    }
  }, [focusedView]);

  if (entryMode === 'LANDING') {
      return <Landing onEnter={() => setEntryMode('OPERATOR')} />;
  }
  
  if (entryMode === 'CUSTOMER' && ghostChannelId) {
      return <Suspense fallback={<LoadingScreen/>}><CustomerPortal channelId={ghostChannelId} inventoryTerms={inventoryTerms} /></Suspense>;
  }
  
  if (entryMode === 'OPERATOR' && !isAuthenticated && appPin) {
      return <LockScreen correctPin={appPin} onUnlock={() => setIsAuthenticated(true)} />;
  }

  const navItems = [
    { id: 'DASHBOARD', label: 'Command', icon: LayoutDashboard },
    { id: 'PROFILE', label: 'Operator', icon: User },
    { id: 'MISSIONS', label: 'Contracts', icon: Briefcase },
    { id: 'SKILLS', label: 'Upgrades', icon: Star },
    { id: 'STOCK', label: 'Inventory', icon: Package },
    { id: 'POS', label: 'Terminal', icon: ShoppingCart },
    { id: 'CUSTOMERS', label: 'Clients', icon: Users },
    { id: 'MARKET_GAME', label: 'Exchange', icon: Gamepad2 },
    { id: 'CASINO', label: 'The Glitch', icon: Dices },
  ];

  const systemItems = [
    { id: 'NETWORK', label: 'Global Grid', icon: Globe },
    { id: 'ANALYTICS', label: 'Intel Deck', icon: PieChart },
    { id: 'LEDGER', label: 'Ledger', icon: FileText },
    { id: 'SETTINGS', label: 'Kernel', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen w-screen bg-cyber-black overflow-hidden flex flex-col">
      {highFidelityMode && <ParticleBackground />}
      <ToastContainer />
      <Suspense fallback={null}>
        <ChatOverlay messages={chatMessages} onSendMessage={sendManagerMessage} onClearChat={clearChat} channelId={storeChannelId}/>
      </Suspense>
      
      <div className="flex h-full w-full overflow-hidden">
        {/* SIDEBAR */}
        <motion.aside 
            animate={{ width: isSidebarOpen ? 256 : 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="bg-cyber-panel border-r border-white/10 flex flex-col py-8 shrink-0 z-20"
        >
            <div className={`px-6 mb-10 flex items-center gap-3 ${isSidebarOpen ? '' : 'justify-center'}`}>
                <div className="w-8 h-8 bg-cyber-gold rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_#D4AF37]">
                    <Zap size={18} className="text-black fill-current" />
                </div>
                {isSidebarOpen && <span className="font-black text-white uppercase tracking-tighter text-xl leading-none">SMP <span className="text-cyber-gold">AI</span></span>}
            </div>

            <nav className="flex-1 space-y-1 px-3 custom-scrollbar overflow-y-auto">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setFocusedView(item.id as ViewState)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                            focusedView === item.id 
                                ? 'bg-cyber-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        } ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <item.icon size={20} className={focusedView === item.id ? '' : 'group-hover:scale-110 transition-transform'} />
                        {isSidebarOpen && <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>}
                    </button>
                ))}
                
                <div className="my-4 h-px bg-white/5 mx-4"></div>

                {systemItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setFocusedView(item.id as ViewState)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                            focusedView === item.id 
                                ? 'bg-cyber-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        } ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <item.icon size={20} />
                        {isSidebarOpen && <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>}
                    </button>
                ))}
            </nav>
            
            <div className="mt-auto px-3">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-colors group">
                    {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    {isSidebarOpen && <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Collapse</span>}
                 </button>
                {isSidebarOpen && (
                    <div className="mt-4 bg-black/40 border border-white/5 rounded-xl p-4">
                       <div className="text-[8px] text-gray-500 uppercase font-black mb-1 tracking-widest">Liquid Funds</div>
                       <div className="text-cyber-green font-mono font-bold text-lg">$ {cashOnHand.toLocaleString()}</div>
                    </div>
                )}
            </div>
        </motion.aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
            <Suspense fallback={<LoadingScreen />}>
                {CurrentView}
            </Suspense>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    const cleanup = useAppStore.getState().initialize();
    return () => cleanup();
  }, []);
  return <AppContent />;
};

export default App;