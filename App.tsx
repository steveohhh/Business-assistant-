import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './DataContext';
import { ViewState, Notification } from './types';
import Stock from './components/Stock';
import POS from './components/POS';
import Customers from './components/Customers';
import Analytics from './components/Analytics';
import Ledger from './components/Ledger';
import Settings from './components/Settings';
import ProfitPlanner from './components/ProfitPlanner';
import LockScreen from './components/LockScreen';
import { generateDailyBriefing } from './services/geminiService';
import { LayoutDashboard, Package, ShoppingCart, Users, PieChart, FileText, Settings as SettingsIcon, Crosshair, X, CheckCircle, AlertTriangle, Info, TrendingUp, DollarSign, Activity, Zap, RefreshCw, ShieldAlert } from 'lucide-react';

// --- TOAST COMPONENT ---
const ToastContainer = () => {
    const { notifications, removeNotification } = useData();
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
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

// --- EXECUTIVE DASHBOARD ---
const Dashboard = ({ onNavigate }: { onNavigate: (v: ViewState) => void }) => {
    const { sales, batches, customers } = useData();
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loadingBriefing, setLoadingBriefing] = useState(false);

    // Calc Daily Stats
    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const dailyRevenue = todaysSales.reduce((acc, s) => acc + s.amount, 0);
    const dailyProfit = todaysSales.reduce((acc, s) => acc + s.profit, 0);
    const activeStock = batches.filter(b => b.currentStock > 0).length;
    const lowStock = batches.filter(b => b.currentStock < b.actualWeight * 0.2).length;

    const handleGetBriefing = async () => {
        setLoadingBriefing(true);
        const text = await generateDailyBriefing(sales, batches, customers);
        setBriefing(text);
        setLoadingBriefing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Command <span className="text-cyber-gold text-outline">Center</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">System Online • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('SETTINGS')} className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white px-3 py-2 rounded-lg font-bold transition-all" title="Settings">
                        <SettingsIcon size={20} />
                    </button>
                    <button onClick={handleGetBriefing} className="bg-cyber-purple/20 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all">
                        {loadingBriefing ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                        {briefing ? "Refresh Briefing" : "AI Briefing"}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Daily Revenue</span>
                        <DollarSign size={16} className="text-cyber-green"/>
                    </div>
                    <div className="text-2xl font-mono text-white font-bold">${dailyRevenue.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{todaysSales.length} Transactions</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Net Profit</span>
                        <TrendingUp size={16} className="text-cyber-gold"/>
                    </div>
                    <div className="text-2xl font-mono text-cyber-gold font-bold">${dailyProfit.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Margin: {dailyRevenue > 0 ? ((dailyProfit/dailyRevenue)*100).toFixed(0) : 0}%</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Active Inventory</span>
                        <Package size={16} className="text-blue-400"/>
                    </div>
                    <div className="text-2xl font-mono text-white font-bold">{activeStock} <span className="text-sm text-gray-500 font-sans font-normal">Batches</span></div>
                    <div className="text-[10px] text-gray-400 mt-1">{batches.length} Total Assets</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Alerts</span>
                        <AlertTriangle size={16} className={lowStock > 0 ? "text-red-500" : "text-gray-600"}/>
                    </div>
                    <div className={`text-2xl font-mono font-bold ${lowStock > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {lowStock}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Low Stock Warnings</div>
                </div>
            </div>

            {/* AI Briefing Card */}
            {briefing && (
                <div className="bg-gradient-to-r from-cyber-purple/10 to-blue-500/10 border-l-4 border-l-cyber-purple rounded-r-xl p-6 backdrop-blur-md animate-fade-in">
                    <h3 className="text-cyber-purple font-bold uppercase text-xs mb-2 flex items-center gap-2"><Zap size={14}/> Executive AI Briefing</h3>
                    <p className="text-white text-lg leading-relaxed font-medium italic">"{briefing}"</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onNavigate('POS')} className="group relative bg-cyber-panel border border-white/10 hover:border-cyber-gold rounded-2xl p-8 transition-all overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <ShoppingCart size={100} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyber-gold transition-colors">Point of Sale</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Launch the sales interface. Access tactical negotiation HUD and process transactions.</p>
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onNavigate('STOCK')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all">
                        <Package size={32} className="text-blue-400 mb-2" />
                        <span className="font-bold text-white">Manage Stock</span>
                    </button>
                    <button onClick={() => onNavigate('CUSTOMERS')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all">
                        <Users size={32} className="text-cyber-green mb-2" />
                        <span className="font-bold text-white">Client CRM</span>
                    </button>
                    <button onClick={() => onNavigate('ANALYTICS')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all">
                        <PieChart size={32} className="text-cyber-gold mb-2" />
                        <span className="font-bold text-white">Analytics</span>
                    </button>
                    <button onClick={() => onNavigate('LEDGER')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all">
                        <FileText size={32} className="text-gray-400 mb-2" />
                        <span className="font-bold text-white">Ledger</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><Activity size={16}/> Live Feed</h3>
                <div className="space-y-3">
                    {sales.length > 0 ? sales.slice().reverse().slice(0, 5).map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyber-green/20 flex items-center justify-center text-cyber-green font-bold text-xs">
                                    $
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm">{s.customerName}</div>
                                    <div className="text-xs text-gray-500">{s.batchName} • {s.weight}g</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-cyber-green font-mono font-bold">+${s.amount.toFixed(2)}</div>
                                <div className="text-[10px] text-gray-500">{new Date(s.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-500 py-4 italic">No activity recorded today.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const { batches, customers, sales, addBatch, deleteBatch, addCustomer, updateCustomer, processSale, settings, addNotification } = useData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auth Logic - Initial Check
  useEffect(() => {
    // If no PIN is set, auto-authenticate
    if (!settings.appPin || settings.appPin === '') {
        setIsAuthenticated(true);
        // Only warn once per session if not warned
        const hasWarned = sessionStorage.getItem('pin_warned');
        if (!hasWarned) {
             addNotification("System Unsecured. Set PIN in Settings.", "WARNING");
             sessionStorage.setItem('pin_warned', 'true');
        }
    } else {
        setIsAuthenticated(false);
    }
  }, [settings.appPin]);

  // Auth Logic - Visibility Change (Auto Lock on Background)
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden' && settings.appPin && settings.appPin !== '') {
              setIsAuthenticated(false);
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [settings.appPin]);

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={setView} />;
      case 'STOCK':
        return <Stock batches={batches} onAddBatch={addBatch} onDeleteBatch={deleteBatch} />;
      case 'POS':
        return <POS batches={batches} customers={customers} onProcessSale={processSale} />;
      case 'CUSTOMERS':
        return <Customers customers={customers} onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} />;
      case 'ANALYTICS':
        return <Analytics sales={sales} />;
      case 'LEDGER':
        return <Ledger sales={sales} />;
      case 'SETTINGS':
        return <Settings />;
      case 'PLANNER':
        return <ProfitPlanner onNavigateToPOS={() => setView('POS')} />;
      default:
        return <div>Unknown View</div>;
    }
  };

  const NavItem = ({ v, icon: Icon, label }: { v: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setView(v)}
      className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all relative overflow-hidden ${view === v ? 'bg-cyber-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
      <Icon size={20} className={`mb-1 transition-transform ${view === v ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      {view === v && <div className="absolute inset-0 bg-white/20 animate-pulse-slow pointer-events-none"></div>}
    </button>
  );

  if (!isAuthenticated && settings.appPin) {
      return (
          <LockScreen 
            correctPin={settings.appPin} 
            onUnlock={() => setIsAuthenticated(true)} 
          />
      );
  }

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden font-sans selection:bg-cyber-gold selection:text-black">
      <ToastContainer />

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-24 bg-[#0a0a0a]/90 backdrop-blur-xl border-r border-white/5 py-8 gap-4 items-center z-20 shadow-2xl">
        <div className="mb-4 cursor-pointer hover:rotate-180 transition-transform duration-700" onClick={() => setView('DASHBOARD')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-cyber-gold to-yellow-200 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-[0_0_15px_rgba(212,175,55,0.5)]">AI</div>
        </div>
        <NavItem v="DASHBOARD" icon={LayoutDashboard} label="Home" />
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
        <NavItem v="STOCK" icon={Package} label="Stock" />
        <NavItem v="POS" icon={ShoppingCart} label="POS" />
        <NavItem v="CUSTOMERS" icon={Users} label="CRM" />
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
        <NavItem v="PLANNER" icon={Crosshair} label="Strategy" />
        <NavItem v="ANALYTICS" icon={PieChart} label="Stats" />
        <NavItem v="LEDGER" icon={FileText} label="Ledger" />
        <div className="mt-auto">
             <NavItem v="SETTINGS" icon={SettingsIcon} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#050505] via-[#050505] to-[#1a1a1a] opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 60%)'
        }}></div>

        <div className="h-full overflow-y-auto p-4 md:p-8 relative z-0">
            {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/10 flex justify-around p-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <NavItem v="DASHBOARD" icon={LayoutDashboard} label="Home" />
        <NavItem v="POS" icon={ShoppingCart} label="POS" />
        <NavItem v="STOCK" icon={Package} label="Stock" />
        <NavItem v="CUSTOMERS" icon={Users} label="CRM" />
        <NavItem v="SETTINGS" icon={SettingsIcon} label="Config" />
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;