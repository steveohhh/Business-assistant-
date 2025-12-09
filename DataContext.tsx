import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Batch, Customer, Sale, AppSettings, BatchExpense, StagedTransaction, Notification, OperationalExpense } from './types';

interface DataContextType {
  batches: Batch[];
  customers: Customer[];
  sales: Sale[];
  operationalExpenses: OperationalExpense[];
  settings: AppSettings;
  stagedTransaction: StagedTransaction | null;
  notifications: Notification[];
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
    currencySymbol: '$',
    lowStockThreshold: 28,
    staffMembers: ['Admin'],
    commissionRate: 5
  });

  // Load from LocalStorage
  useEffect(() => {
    const loadedBatches = localStorage.getItem('smp_batches');
    const loadedCustomers = localStorage.getItem('smp_customers');
    const loadedSales = localStorage.getItem('smp_sales');
    const loadedOps = localStorage.getItem('smp_ops_expenses');
    const loadedSettings = localStorage.getItem('smp_settings');

    if (loadedBatches) {
        // Migration logic for existing batches without new fields
        const parsed: Batch[] = JSON.parse(loadedBatches);
        const migrated = parsed.map(b => ({
            ...b,
            expenses: b.expenses || [],
            personalUse: b.personalUse || 0,
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
        avatarImage: c.avatarImage || ''
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
            staffMembers: parsedSettings.staffMembers || ['Admin'],
            commissionRate: parsedSettings.commissionRate || 5
        });
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
      // 1. Calculate Total Costs
      const extraExpenses = b.expenses ? b.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
      const totalCost = b.purchasePrice + b.fees + extraExpenses;

      // 2. Calculate Sellable Weight (Ordered - Provider Cut - Personal Use)
      const sellableWeight = Math.max(0.1, b.orderedWeight - b.providerCut - b.personalUse);

      // 3. True Cost
      const trueCostPerGram = totalCost / sellableWeight;

      return {
          ...b,
          actualWeight: sellableWeight, // Update this to reflect theoretical max sellable
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

  const processSale = (batchId: string, customerId: string, salesRep: string, weight: number, amount: number, profit: number) => {
    // 1. Create Sale Record
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

    // 2. Update Batch Stock
    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, currentStock: b.currentStock - weight } : b
    ));

    // 3. Update Customer History
    const updatedCustomer = {
      ...customer,
      totalSpent: customer.totalSpent + amount,
      lastPurchase: newSale.timestamp,
      transactionHistory: [...customer.transactionHistory, newSale]
    };
    // Don't call addNotification here via updateCustomer to avoid double toast
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));

    addNotification("Transaction executed successfully.", 'SUCCESS');
  };

  return (
    <DataContext.Provider value={{ batches, customers, sales, operationalExpenses, settings, stagedTransaction, notifications, addBatch, updateBatch, deleteBatch, addCustomer, updateCustomer, processSale, addOperationalExpense, deleteOperationalExpense, updateSettings, stageTransaction, addNotification, removeNotification }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};