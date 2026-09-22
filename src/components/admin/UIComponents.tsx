import { ReactNode } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Upload
} from 'lucide-react';

// Loading Spinner
export function LoadingSpinner({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-orange-500`} />
    </div>
  );
}

// Loading State
export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  );
}

// Empty State
export function EmptyState({ 
  icon: Icon, 
  title, 
  description,
  action 
}: { 
  icon: any; 
  title: string; 
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <Icon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Status Badge
export function StatusBadge({ status, text }: { status: string; text?: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      case 'pending':
      case 'processing':
      case 'under_review':
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{text || status}</span>
    </span>
  );
}

// Stats Card
export function StatsCard({ 
  icon: Icon, 
  value, 
  label, 
  trend,
  color = 'blue'
}: { 
  icon: any; 
  value: string | number; 
  label: string;
  trend?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

// Search Input
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Rechercher...' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
}

// Filter Select
export function FilterSelect({ 
  value, 
  onChange, 
  options,
  label = 'Filtrer'
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    >
      <option value="all">{label} - Tous</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Action Button
export function ActionButton({ 
  onClick, 
  children, 
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: Icon
}: { 
  onClick: () => void; 
  children: ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: any;
}) {
  const variantClasses = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
    >
      {loading ? <LoadingSpinner size="small" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

// Modal
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Alert Message
export function AlertMessage({ 
  type, 
  message, 
  onDismiss 
}: { 
  type: 'success' | 'error' | 'warning' | 'info'; 
  message: string; 
  onDismiss?: () => void;
}) {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const typeIcons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className={`p-4 border rounded-lg flex items-center gap-2 ${typeClasses[type]}`}>
      {typeIcons[type]}
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-70 hover:opacity-100">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Data Table
export function DataTable<T>({ 
  data, 
  columns, 
  emptyMessage = 'Aucune donnée disponible'
}: { 
  data: T[]; 
  columns: { 
    key: keyof T; 
    label: string; 
    render?: (value: any, row: T) => ReactNode;
  }[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={String(column.key)} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-4 whitespace-nowrap text-sm">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
