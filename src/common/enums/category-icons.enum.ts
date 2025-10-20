// src/common/enums/category-icons.enum.ts
export enum CategoryIcon {
  // Despesas
  FOOD = 'food',
  TRANSPORT = 'transport',
  HOME = 'home',
  HEALTH = 'health',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  BILLS = 'bills',
  SUBSCRIPTIONS = 'subscriptions',
  TRAVEL = 'travel',
  GIFTS = 'gifts',
  
  // Receitas
  SALARY = 'salary',
  FREELANCE = 'freelance',
  INVESTMENTS = 'investments',
  BONUS = 'bonus',
  RENTAL = 'rental',
  DIVIDENDS = 'dividends',
  
  // Geral
  DEFAULT = 'default',
  UTILITIES = 'utilities',
  OTHER = 'other'
}

// Mapeamento para diferentes bibliotecas de ícones
export const IconLibraries = {
  // Lucide React (moderna, recomendada)
  lucide: {
    [CategoryIcon.FOOD]: 'Utensils',
    [CategoryIcon.TRANSPORT]: 'Car',
    [CategoryIcon.HOME]: 'Home',
    [CategoryIcon.HEALTH]: 'Heart',
    [CategoryIcon.EDUCATION]: 'Book',
    [CategoryIcon.ENTERTAINMENT]: 'Gamepad',
    [CategoryIcon.SHOPPING]: 'ShoppingBag',
    [CategoryIcon.BILLS]: 'FileText',
    [CategoryIcon.SUBSCRIPTIONS]: 'RefreshCw',
    [CategoryIcon.TRAVEL]: 'Plane',
    [CategoryIcon.GIFTS]: 'Gift',
    [CategoryIcon.SALARY]: 'DollarSign',
    [CategoryIcon.FREELANCE]: 'Briefcase',
    [CategoryIcon.INVESTMENTS]: 'TrendingUp',
    [CategoryIcon.BONUS]: 'Star',
    [CategoryIcon.RENTAL]: 'Building',
    [CategoryIcon.DIVIDENDS]: 'PieChart',
    [CategoryIcon.UTILITIES]: 'Zap',
    [CategoryIcon.OTHER]: 'Circle',
    [CategoryIcon.DEFAULT]: 'Folder'
  },
  
  // Font Awesome
  fontAwesome: {
    [CategoryIcon.FOOD]: 'utensils',
    [CategoryIcon.TRANSPORT]: 'car',
    [CategoryIcon.HOME]: 'home',
    [CategoryIcon.HEALTH]: 'heart',
    [CategoryIcon.EDUCATION]: 'book',
    [CategoryIcon.ENTERTAINMENT]: 'gamepad',
    [CategoryIcon.SHOPPING]: 'shopping-bag',
    [CategoryIcon.BILLS]: 'file-invoice-dollar',
    [CategoryIcon.SUBSCRIPTIONS]: 'sync',
    [CategoryIcon.TRAVEL]: 'plane',
    [CategoryIcon.GIFTS]: 'gift',
    [CategoryIcon.SALARY]: 'dollar-sign',
    [CategoryIcon.FREELANCE]: 'briefcase',
    [CategoryIcon.INVESTMENTS]: 'chart-line',
    [CategoryIcon.BONUS]: 'star',
    [CategoryIcon.RENTAL]: 'building',
    [CategoryIcon.DIVIDENDS]: 'chart-pie',
    [CategoryIcon.UTILITIES]: 'bolt',
    [CategoryIcon.OTHER]: 'circle',
    [CategoryIcon.DEFAULT]: 'folder'
  },
  
  // Material Icons
  material: {
    [CategoryIcon.FOOD]: 'restaurant',
    [CategoryIcon.TRANSPORT]: 'directions_car',
    [CategoryIcon.HOME]: 'home',
    [CategoryIcon.HEALTH]: 'favorite',
    [CategoryIcon.EDUCATION]: 'menu_book',
    [CategoryIcon.ENTERTAINMENT]: 'sports_esports',
    [CategoryIcon.SHOPPING]: 'shopping_bag',
    [CategoryIcon.BILLS]: 'receipt_long',
    [CategoryIcon.SUBSCRIPTIONS]: 'autorenew',
    [CategoryIcon.TRAVEL]: 'flight',
    [CategoryIcon.GIFTS]: 'card_giftcard',
    [CategoryIcon.SALARY]: 'attach_money',
    [CategoryIcon.FREELANCE]: 'work',
    [CategoryIcon.INVESTMENTS]: 'trending_up',
    [CategoryIcon.BONUS]: 'star',
    [CategoryIcon.RENTAL]: 'apartment',
    [CategoryIcon.DIVIDENDS]: 'pie_chart',
    [CategoryIcon.UTILITIES]: 'flash_on',
    [CategoryIcon.OTHER]: 'lens',
    [CategoryIcon.DEFAULT]: 'folder'
  },
  
  // Emojis (fallback)
  emoji: {
    [CategoryIcon.FOOD]: '🍔',
    [CategoryIcon.TRANSPORT]: '🚗',
    [CategoryIcon.HOME]: '🏠',
    [CategoryIcon.HEALTH]: '❤️',
    [CategoryIcon.EDUCATION]: '📚',
    [CategoryIcon.ENTERTAINMENT]: '🎮',
    [CategoryIcon.SHOPPING]: '🛍️',
    [CategoryIcon.BILLS]: '📄',
    [CategoryIcon.SUBSCRIPTIONS]: '🔄',
    [CategoryIcon.TRAVEL]: '✈️',
    [CategoryIcon.GIFTS]: '🎁',
    [CategoryIcon.SALARY]: '💰',
    [CategoryIcon.FREELANCE]: '💼',
    [CategoryIcon.INVESTMENTS]: '📈',
    [CategoryIcon.BONUS]: '⭐',
    [CategoryIcon.RENTAL]: '🏢',
    [CategoryIcon.DIVIDENDS]: '🥧',
    [CategoryIcon.UTILITIES]: '⚡',
    [CategoryIcon.OTHER]: '●',
    [CategoryIcon.DEFAULT]: '📁'
  }
};

// Helper para obter ícone de uma biblioteca específica
export function getIcon(icon: CategoryIcon, library: keyof typeof IconLibraries = 'lucide'): string {
  return IconLibraries[library][icon] || IconLibraries[library][CategoryIcon.DEFAULT];
}

// Helper para obter todos os ícones de uma biblioteca
export function getIconsForLibrary(library: keyof typeof IconLibraries): Record<CategoryIcon, string> {
  return IconLibraries[library];
}