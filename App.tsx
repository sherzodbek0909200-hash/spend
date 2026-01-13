
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  BrainCircuit, 
  Wallet, 
  TrendingUp, 
  History, 
  Camera, 
  MessageSquare,
  Search,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Expense, Category } from './types';
import { parseExpenseFromText, getBudgetInsights, analyzeReceipt } from './services/geminiService';
import ExpenseChart from './components/ExpenseChart';

const CATEGORIES: Category[] = ['Oziq-ovqat', 'Transport', 'Ko\'ngilochar', 'Sog\'liq', 'Ta\'lim', 'Uy-joy', 'Boshqa'];

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('expenses');
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (newExpense: Partial<Expense>) => {
    const expense: Expense = {
      id: Date.now().toString(),
      amount: newExpense.amount || 0,
      category: newExpense.category || 'Boshqa',
      description: newExpense.description || 'Izohsiz',
      date: new Date().toISOString(),
    };
    setExpenses(prev => [expense, ...prev]);
  };

  const handleAiInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAiLoading(true);
    try {
      const result = await parseExpenseFromText(inputText);
      if (result.amount) {
        addExpense(result);
        setInputText('');
      }
    } catch (error) {
      console.error("AI parsing error", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const fetchInsights = async () => {
    setIsInsightLoading(true);
    try {
      const insight = await getBudgetInsights(expenses);
      setAiInsight(insight);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInsightLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAiLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeReceipt(base64);
      if (result.amount) {
        addExpense(result);
      }
      setIsAiLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ExpenseAI</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchInsights}
              disabled={isInsightLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors"
            >
              {isInsightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              AI Maslahat
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Umumiy harajat</p>
              <h2 className="text-2xl font-bold text-slate-900">{totalSpent.toLocaleString()} so'm</h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Harajatlar soni</p>
              <h2 className="text-2xl font-bold text-slate-900">{expenses.length} ta</h2>
            </div>
          </div>
        </div>

        {/* AI Input Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden relative">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            AI orqali qo'shish
          </h3>
          <form onSubmit={handleAiInput} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Masalan: Bugun tushlikka 45000 so'm ishlatdim"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                disabled={isAiLoading}
              />
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={isAiLoading || !inputText.trim()}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Qo'shish
              </button>
              <label className="cursor-pointer px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            Maslahat: "Taksi 15000", "Kofe 25000", "Bozorlik 200k" deb yozishingiz mumkin.
          </p>
        </section>

        {/* AI Insight Box */}
        {aiInsight && (
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-24 h-24" />
             </div>
             <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
               <BrainCircuit className="w-5 h-5" />
               AI Tahlili
             </h4>
             <div className="prose prose-invert max-w-none text-blue-50">
               {aiInsight.split('\n').map((line, i) => (
                 <p key={i} className="mb-2 last:mb-0">{line}</p>
               ))}
             </div>
             <button 
               onClick={() => setAiInsight('')}
               className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-200 hover:text-white"
             >
               Yopish
             </button>
          </div>
        )}

        {/* Charts */}
        <ExpenseChart expenses={expenses} />

        {/* Recent History */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Oxirgi harajatlar
            </h3>
            <span className="text-xs font-medium text-slate-400">{expenses.length} ta yozuv</span>
          </div>
          <div className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400">Hali hech qanday harajat qo'shilmagan</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm
                      ${expense.category === 'Oziq-ovqat' ? 'bg-orange-100 text-orange-600' : 
                        expense.category === 'Transport' ? 'bg-blue-100 text-blue-600' :
                        expense.category === 'Ko\'ngilochar' ? 'bg-purple-100 text-purple-600' :
                        'bg-slate-100 text-slate-600'}
                    `}>
                      {expense.category[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{expense.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-500">{expense.category}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">-{expense.amount.toLocaleString()} so'm</span>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button for Mobile Add */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
          <Plus className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default App;
