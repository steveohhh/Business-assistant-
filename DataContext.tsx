import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Batch, Customer, Sale, AppSettings, BatchExpense, StagedTransaction, Notification, OperationalExpense, BackupData, POSState } from './types';

interface DataContextType {
  batches: Batch[];
  customers: Customer[];
  sales: Sale[];
  operationalExpenses: OperationalExpense[];
  settings: AppSettings;
  stagedTransaction: StagedTransaction | null;
  notifications: Notification[];
  posState: POSState; // Persistent POS state
  updatePOSState: (state: Partial<POSState>) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  deleteBatch: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  processSale: (batchId: string, customerId: string, salesRep: string, weight: number, amount: number, profit: number) => void;
  addOperationalExpense: (expense: OperationalExpense) => void;
  deleteOperationalExpense: (id: string) => void;
  updateSettings: (newSettings: AppSettings) => void;
  stageTransaction: (tx: StagedTransaction | null) => void;
  addNotification: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING') => void;
  removeNotification: (id: string) => void;
  loadBackup: (data: BackupData) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>([]);
  const [stagedTransaction, setStagedTransaction] = useState<StagedTransaction | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Default Settings
  const [settings, setSettings] = useState<AppSettings>({
    defaultPricePerGram: 10,
    defaultWholesalePrice: 6,
    defaultCostEstimate: 3,
    currencySymbol: '$',
    lowStockThreshold: 28,
    staffMembers: ['Admin'],
    expenseCategories: ['Payout', 'Supplies', 'Transport', 'Marketing', 'Misc'],
    commissionRate: 5,
    appPin: '' 
  });

  // Persistent POS State
  const [posState, setPosState] = useState<POSState>({
      batchId: '',
      customerId: '',
      salesRep: 'Admin',
      pricingTier: 'RETAIL',
      cashInput: '',
      weightInput: '',
      targetPrice: 10
  });

  // Load from LocalStorage
  useEffect(() => {
    const loadedBatches = localStorage.getItem('smp_batches');
    const loadedCustomers = localStorage.getItem('smp_customers');
    const loadedSales = localStorage.getItem('smp_sales');
    const loadedOps = localStorage.getItem('smp_ops_expenses');
    const loadedSettings = localStorage.getItem('smp_settings');

    if (loadedBatches) {
        // Migration logic
        const parsed: any[] = JSON.parse(loadedBatches);
        const migrated: Batch[] = parsed.map((b: any) => ({
            ...b,
            strainType: (b.strainType === 'Indica' || b.strainType === 'Sativa' || b.strainType === 'Hybrid') ? 'Rock' : b.strainType, 
            expenses: b.expenses || [],
            personalUse: b.personalUse || 0,
            loss: b.loss || 0, // New migration
            targetRetailPrice: b.targetRetailPrice || 0,
            wholesalePrice: b.wholesalePrice || 0
        }));
        setBatches(migrated);
    }
    if (loadedCustomers) {
      const parsedCustomers: Customer[] = JSON.parse(loadedCustomers);
      const migratedCustomers = parsedCustomers.map(c => ({
        ...c,
        tags: c.tags || [],
        visualDescription: c.visualDescription || '',
        avatarImage: c.avatarImage || '',
        microSignals: c.microSignals || [],
        encounters: c.encounters || [] // New migration
      }));
      setCustomers(migratedCustomers);
    }
    if (loadedSales) {
        const parsedSales: Sale[] = JSON.parse(loadedSales);
        const migratedSales = parsedSales.map(s => ({
            ...s,
            salesRep: s.salesRep || 'Admin'
        }));
        setSales(migratedSales);
    }
    if (loadedOps) {
        setOperationalExpenses(JSON.parse(loadedOps));
    }
    if (loadedSettings) {
        const parsedSettings = JSON.parse(loadedSettings);
        setSettings({
            ...parsedSettings,
            defaultWholesalePrice: parsedSettings.defaultWholesalePrice || 6,
            defaultCostEstimate: parsedSettings.defaultCostEstimate || 3,
            expenseCategories: parsedSettings.expenseCategories || ['Payout', 'Supplies', 'Transport', 'Marketing', 'Misc'],
            staffMembers: parsedSettings.staffMembers || ['Admin'],
            commissionRate: parsedSettings.commissionRate || 5,
            appPin: parsedSettings.appPin || ''
        });
        
        // Update POS default rep if settings loaded
        if (parsedSettings.staffMembers && parsedSettings.staffMembers.length > 0) {
            setPosState(prev => ({ ...prev, salesRep: parsedSettings.staffMembers[0] }));
        }
    }
  }, []);

  // Save to LocalStorage effects
  useEffect(() => localStorage.setItem('smp_batches', JSON.stringify(batches)), [batches]);
  useEffect(() => localStorage.setItem('smp_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('smp_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('smp_ops_expenses', JSON.stringify(operationalExpenses)), [operationalExpenses]);
  useEffect(() => localStorage.setItem('smp_settings', JSON.stringify(settings)), [settings]);

  // Notifications
  const addNotification = (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING' = 'INFO') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeNotification(id), 4000);
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const recalculateBatchCost = (b: Batch): Batch => {
      const extraExpenses = b.expenses ? b.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
      const totalCost = b.purchasePrice + b.fees + extraExpenses;
      // Subtract personal use and loss from sellable weight
      const sellableWeight = Math.max(0.1, b.orderedWeight - b.providerCut - b.personalUse - (b.loss || 0));
      const trueCostPerGram = totalCost / sellableWeight;

      return {
          ...b,
          actualWeight: sellableWeight, 
          trueCostPerGram
      };
  };

  const addBatch = (batch: Batch) => {
      setBatches(prev => [recalculateBatchCost(batch), ...prev]);
      addNotification(`Batch "${batch.name}" added successfully.`, 'SUCCESS');
  };

  const updateBatch = (batch: Batch) => {
      setBatches(prev => prev.map(b => b.id === batch.id ? recalculateBatchCost(batch) : b));
      addNotification(`Batch "${batch.name}" updated.`, 'SUCCESS');
  };
  
  const deleteBatch = (id: string) => {
      setBatches(prev => prev.filter(b => b.id !== id));
      addNotification("Batch deleted.", 'WARNING');
  };

  const addCustomer = (customer: Customer) => {
      setCustomers(prev => [customer, ...prev]);
      addNotification("New client registered.", 'SUCCESS');
  };
  
  const updateCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    addNotification("Client data updated.", 'SUCCESS');
  };

  const addOperationalExpense = (expense: OperationalExpense) => {
      setOperationalExpenses(prev => [...prev, expense]);
      addNotification("Drawer deduction recorded.", 'WARNING');
  };

  const deleteOperationalExpense = (id: string) => {
      setOperationalExpenses(prev => prev.filter(e => e.id !== id));
      addNotification("Expense removed from ledger.", 'INFO');
  };

  const updateSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      addNotification("System settings saved.", 'SUCCESS');
  };

  const stageTransaction = (tx: StagedTransaction | null) => {
      setStagedTransaction(tx);
      if (tx) addNotification("Transaction staged for POS.", 'INFO');
  };

  const updatePOSState = (newState: Partial<POSState>) => {
      setPosState(prev => ({ ...prev, ...newState }));
  };

  const processSale = (batchId: string, customerId: string, salesRep: string, weight: number, amount: number, profit: number) => {
    const batch = batches.find(b => b.id === batchId);
    const customer = customers.find(c => c.id === customerId);
    if (!batch || !customer) return;

    const newSale: Sale = {
      id: Date.now().toString(),
      batchId,
      batchName: batch.name,
      customerId,
      customerName: customer.name,
      salesRep,
      weight,
      amount,
      costBasis: weight * batch.trueCostPerGram,
      profit,
      timestamp: new Date().toISOString()
    };

    setSales(prev => [...prev, newSale]);

    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, currentStock: b.currentStock - weight } : b
    ));

    const updatedCustomer = {
      ...customer,
      totalSpent: customer.totalSpent + amount,
      lastPurchase: newSale.timestamp,
      transactionHistory: [...customer.transactionHistory, newSale]
    };
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));

    // Reset POS State inputs but keep user/rep
    setPosState(prev => ({
        ...prev,
        weightInput: '',
        cashInput: ''
    }));

    addNotification("Transaction executed successfully.", 'SUCCESS');
  };

  const loadBackup = (data: BackupData) => {
      try {
          if (data.batches) setBatches(data.batches);
          if (data.customers) setCustomers(data.customers);
          if (data.sales) setSales(data.sales);
          if (data.operationalExpenses) setOperationalExpenses(data.operationalExpenses);
          if (data.settings) setSettings(data.settings);
          
          addNotification("Database restored successfully.", "SUCCESS");
      } catch (e) {
          console.error("Backup load error", e);
          addNotification("Corrupt backup file.", "ERROR");
      }
  };

  return (
    <DataContext.Provider value={{ batches, customers, sales, operationalExpenses, settings, stagedTransaction, notifications, posState, updatePOSState, addBatch, updateBatch, deleteBatch, addCustomer, updateCustomer, processSale, addOperationalExpense, deleteOperationalExpense, updateSettings, stageTransaction, addNotification, removeNotification, loadBackup }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};