import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Auth
    "auth.welcome": "Financial Wellness for Humans",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin": "Sign In",
    "auth.or_secure": "Or secure login with",
    "auth.verifying": "Verifying...",
    "auth.faceid": "Face ID",
    "auth.encryption": "Bank-grade 256-bit encryption",
    "auth.create_account": "Don't have an account?",
    "auth.create_one": "Create one",

    // Dashboard
    "dash.hello": "Hello",
    "dash.subtitle": "Let's crush some debt today.",
    "dash.upgrade": "Upgrade",
    "dash.trial_left": "Pro Trial: {days} days left",
    "dash.spending_power": "Free Spending Power",
    "dash.safe_spend": "Safe to spend this month.",
    "dash.includes_goals": "Includes ${amount} set aside for your goals.",
    "dash.covered": "All bills and debt goals are covered.",
    "dash.manage_goals": "Manage Goals",
    "dash.income": "Income",
    "dash.fixed": "Fixed",
    "dash.streak": "Day Streak",
    "dash.momentum": "Keep the momentum going!",
    "dash.claim_xp": "Claim XP",
    "dash.insights": "AI Financial Insights",
    "dash.no_insights": "No insights available at the moment.",
    "dash.action_plan": "Action Plan",
    "dash.no_actions": "No pending actions. You're all clear!",
    "dash.optimal_timing": "Optimal Timing",
    "dash.demo_payday": "[Demo: Simulate Payday]",

    // Debt Command
    "debt.title": "Debt Command",
    "debt.realtime": "Real-time",
    "debt.snowball": "Snowball",
    "debt.avalanche": "Avalanche",
    "debt.progress": "Progress",
    "debt.paid": "Paid",
    "debt.min": "Min",
    "debt.pay_now": "Pay Now",
    "debt.target": "Current Target",
    "debt.simulator": "What If Simulator",
    "debt.try_it": "Try it out",
    "debt.simulate_extra": "Simulate Extra Payment",
    "debt.max_safe": "Max Safe",
    "debt.time_saved": "Time Saved",
    "debt.interest_saved": "Interest Saved",

    // Profile
    "profile.warrior": "Financial Warrior",
    "profile.go_pro": "Go Professional",
    "profile.unlock_ai": "Unlock advanced AI & unlimited goals",
    "profile.net_worth": "Net Worth",
    "profile.assets": "Assets",
    "profile.debts": "Debts",
    "profile.add": "Add",
    "profile.vault": "Achievement Vault",
    "profile.unlocked": "Unlocked",
    "profile.settings": "App Settings",
    "profile.level": "Lvl",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.smart_nudges": "Smart Income Nudges",
    "settings.alert_paid": "Alert when you get paid",
    "settings.payday": "Expected Payday",
    "settings.remind_before": "Remind Before Due Date",
    "settings.days": "Days",
    "settings.save": "Save Preferences",
    "settings.english": "English",
    "settings.spanish": "Español (Latam)",

    // Advisor
    "advisor.title": "FinNavi Advisor",
    "advisor.subtitle": "Online • Behavioral AI",
    "advisor.placeholder": "Ask about your debts...",
    "advisor.intro": "Hi {name}! I'm FinNavi. I noticed you have ${amount} in free spending power this month. How can I help you optimize it?",
    "advisor.intro_es": "¡Hola {name}! Soy FinNavi. Noté que tienes ${amount} de poder de gasto libre este mes. ¿Cómo puedo ayudarte a optimizarlo?",

    // Social
    "social.community": "Community",
    "social.compete": "Compete & Grow Together",
    "social.active_challenges": "Active Challenges",
    "social.days_left": "days left",
    "social.group_goal": "Group Goal",
    "social.leaderboard": "Leaderboard",
    "social.you": "(You)",

    // Add Transaction
    "add.title": "Add Transaction",
    "add.expense": "Expense",
    "add.income": "Income",
    "add.amount": "Amount",
    "add.date": "Date",
    "add.category": "Category",
    "add.note": "Merchant / Note",
    "add.scan_title": "Scan Receipt or Bill",
    "add.scan_desc": "Use AI to auto-fill details from photo",
    "add.upload": "Upload File",
    "add.camera": "Take Photo",
    "add.analyzing": "Analyzing receipt...",
    "add.save": "Save Transaction",
    "add.success": "Transaction Saved!",
    "add.manual": "Manual Entry",
  },
  es: {
    // Auth
    "auth.welcome": "Bienestar Financiero para Humanos",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.signin": "Iniciar Sesión",
    "auth.or_secure": "O ingreso seguro con",
    "auth.verifying": "Verificando...",
    "auth.faceid": "Face ID",
    "auth.encryption": "Encriptación bancaria de 256-bits",
    "auth.create_account": "¿No tienes cuenta?",
    "auth.create_one": "Crea una",

    // Dashboard
    "dash.hello": "Hola",
    "dash.subtitle": "Aplastemos esa deuda hoy.",
    "dash.upgrade": "Mejorar",
    "dash.trial_left": "Prueba Pro: quedan {days} días",
    "dash.spending_power": "Poder de Gasto Libre",
    "dash.safe_spend": "Seguro para gastar este mes.",
    "dash.includes_goals": "Incluye ${amount} reservados para tus metas.",
    "dash.covered": "Todas las facturas y metas están cubiertas.",
    "dash.manage_goals": "Metas",
    "dash.income": "Ingresos",
    "dash.fixed": "Fijos",
    "dash.streak": "Racha de Días",
    "dash.momentum": "¡Mantén el impulso!",
    "dash.claim_xp": "Reclamar XP",
    "dash.insights": "Insights Financieros con IA",
    "dash.no_insights": "No hay insights disponibles por el momento.",
    "dash.action_plan": "Plan de Acción",
    "dash.no_actions": "No hay acciones pendientes. ¡Todo limpio!",
    "dash.optimal_timing": "Momento Óptimo",
    "dash.demo_payday": "[Demo: Simular Pago]",

    // Debt Command
    "debt.title": "Comando de Deuda",
    "debt.realtime": "Tiempo real",
    "debt.snowball": "Bola de Nieve",
    "debt.avalanche": "Avalancha",
    "debt.progress": "Progreso",
    "debt.paid": "Pagado",
    "debt.min": "Mín",
    "debt.pay_now": "Pagar Ahora",
    "debt.target": "Objetivo Actual",
    "debt.simulator": "Simulador What-If",
    "debt.try_it": "Pruébalo",
    "debt.simulate_extra": "Simular Pago Extra",
    "debt.max_safe": "Máx Seguro",
    "debt.time_saved": "Tiempo Ahorrado",
    "debt.interest_saved": "Interés Ahorrado",

    // Profile
    "profile.warrior": "Guerrero Financiero",
    "profile.go_pro": "Hazte Pro",
    "profile.unlock_ai": "Desbloquea IA avanzada y metas ilimitadas",
    "profile.net_worth": "Patrimonio Neto",
    "profile.assets": "Activos",
    "profile.debts": "Deudas",
    "profile.add": "Agregar",
    "profile.vault": "Bóveda de Logros",
    "profile.unlocked": "Desbloqueados",
    "profile.settings": "Configuración",
    "profile.level": "Nvl",

    // Settings
    "settings.title": "Configuración",
    "settings.language": "Idioma",
    "settings.smart_nudges": "Alertas Inteligentes de Ingreso",
    "settings.alert_paid": "Avisar cuando recibas tu pago",
    "settings.payday": "Día de Pago Esperado",
    "settings.remind_before": "Recordar antes del vencimiento",
    "settings.days": "Días",
    "settings.save": "Guardar Preferencias",
    "settings.english": "English",
    "settings.spanish": "Español (Latam)",

    // Advisor
    "advisor.title": "Asesor FinNavi",
    "advisor.subtitle": "En línea • IA Conductual",
    "advisor.placeholder": "Pregunta sobre tus deudas...",
    "advisor.intro": "Hi {name}! I'm FinNavi. I noticed you have ${amount} in free spending power this month. How can I help you optimize it?",
    "advisor.intro_es": "¡Hola {name}! Soy FinNavi. Noté que tienes ${amount} de poder de gasto libre este mes. ¿Cómo puedo ayudarte a optimizarlo?",

    // Social
    "social.community": "Comunidad",
    "social.compete": "Compite y Crece Juntos",
    "social.active_challenges": "Desafíos Activos",
    "social.days_left": "días restantes",
    "social.group_goal": "Meta Grupal",
    "social.leaderboard": "Tabla de Clasificación",
    "social.you": "(Tú)",

    // Add Transaction
    "add.title": "Agregar Transacción",
    "add.expense": "Gasto",
    "add.income": "Ingreso",
    "add.amount": "Monto",
    "add.date": "Fecha",
    "add.category": "Categoría",
    "add.note": "Comercio / Nota",
    "add.scan_title": "Escanear Recibo",
    "add.scan_desc": "Usa IA para autocompletar con una foto",
    "add.upload": "Subir Archivo",
    "add.camera": "Tomar Foto",
    "add.analyzing": "Analizando recibo...",
    "add.save": "Guardar Transacción",
    "add.success": "¡Transacción Guardada!",
    "add.manual": "Entrada Manual",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es'); // Default to Spanish as per user intent "adecuar"

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
