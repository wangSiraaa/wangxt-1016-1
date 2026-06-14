import { useState, useMemo } from 'react';
import { X, Calendar, RefreshCw, AlertTriangle, CloudSun, Calculator, CheckCircle, XCircle } from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import { cn } from '@/lib/utils';
import { formatDate, addDays } from '@/utils/dateUtils';
import { calculateRescheduleFeeDetails, formatCurrency } from '@/utils/feeUtils';
import ConflictExplain from './ConflictExplain';
import FeeTrial from './FeeTrial';
import type { WeatherOption, OrderResource } from '@/types';
import { recalculateResourceTimes, calculateResourcePrice } from '@/utils/feeUtils';

interface RescheduleModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RescheduleModal({ orderId, isOpen, onClose }: RescheduleModalProps) {
  const { orders, checkRescheduleConflicts, applyReschedule, canReschedule } = useWeddingStore();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [weatherBackup, setWeatherBackup] = useState(false);
  const [step, setStep] = useState<'date' | 'confirm'>('date');
  const [result, setResult] = useState<{ success: boolean; message: string; fee?: number } | null>(null);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const canRescheduleOrder = order ? canReschedule(orderId) : false;

  const weatherOptions: WeatherOption[] = useMemo(() => {
    if (!newDate) return [];
    const conditions = ['晴', '多云', '阴', '小雨', '中雨'];
    const options: WeatherOption[] = [];
    for (let i = -3; i <= 3; i++) {
      const date = addDays(newDate, i);
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const temp = 15 + Math.floor(Math.random() * 15);
      options.push({
        date: formatDate(date),
        condition,
        temperature: `${temp}°C`,
        suitable: !condition.includes('雨'),
        backupAvailable: Math.random() > 0.3,
      });
    }
    return options;
  }, [newDate]);

  const conflicts = useMemo(() => {
    if (!newDate || !order) return [];
    return checkRescheduleConflicts(orderId, newDate);
  }, [orderId, newDate, order, checkRescheduleConflicts]);

  const feeCalculation = useMemo(() => {
    if (!order || !newDate) return null;

    const newResources: OrderResource[] = order.resources.map((r) => {
      const times = recalculateResourceTimes(
        newDate,
        10,
        r.resource.preparationHours,
        r.resource.serviceHours,
        r.resource.cleanupHours
      );
      const newPrice = calculateResourcePrice(r.resource.basePrice, r.resource.serviceHours, newDate);
      return {
        ...r,
        ...times,
        price: newPrice,
      };
    });

    return calculateRescheduleFeeDetails(order, newResources, newDate);
  }, [order, newDate]);

  const handleSubmit = () => {
    if (!order || !newDate) return;
    
    const result = applyReschedule(orderId, newDate, reason, weatherBackup);
    setResult(result);
    setStep('confirm');
  };

  const handleClose = () => {
    setNewDate('');
    setReason('');
    setWeatherBackup(false);
    setStep('date');
    setResult(null);
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">改期申请</h2>
              <p className="text-sm text-gray-500">{order.customerName} - {order.orderNo}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!canRescheduleOrder ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">无法改期</h3>
            <p className="text-gray-500">婚礼日期已过，不能进行改期操作</p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        ) : step === 'date' ? (
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择新的婚礼日期
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={formatDate(new Date())}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {newDate && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CloudSun className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-gray-800">天气参考</h3>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weatherOptions.map((weather) => (
                    <div
                      key={weather.date}
                      className={cn(
                        'p-3 rounded-xl text-center border-2 transition-all cursor-pointer',
                        weather.date === newDate
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 hover:border-gray-200',
                        !weather.suitable && 'opacity-60'
                      )}
                      onClick={() => weather.backupAvailable && setNewDate(weather.date)}
                    >
                      <p className="text-xs text-gray-500 mb-1">
                        {weather.date.slice(5)}
                      </p>
                      <p className="text-lg mb-1">
                        {weather.condition === '晴' && '☀️'}
                        {weather.condition === '多云' && '⛅'}
                        {weather.condition === '阴' && '☁️'}
                        {weather.condition.includes('雨') && '🌧️'}
                      </p>
                      <p className="text-xs text-gray-600">{weather.temperature}</p>
                      {weather.suitable ? (
                        <p className="text-xs text-green-600 mt-1">适宜</p>
                      ) : (
                        <p className="text-xs text-red-500 mt-1">不宜</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newDate && conflicts.length > 0 && (
              <div className="mb-6">
                <ConflictExplain conflicts={conflicts} title="资源冲突检测" />
              </div>
            )}

            {newDate && feeCalculation && (
              <div className="mb-6">
                <FeeTrial calculation={feeCalculation} title="改期费用试算" />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                改期原因
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请输入改期原因..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weatherBackup}
                  onChange={(e) => setWeatherBackup(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">启用天气备选方案</span>
                  <p className="text-xs text-gray-500">如遇恶劣天气，可启用备选日期</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newDate || !reason || conflicts.length > 0}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  !newDate || !reason || conflicts.length > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                )}
              >
                提交改期申请
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            {result?.success ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">改期申请已提交</h3>
                <p className="text-gray-500 mb-6">{result.message}</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500">新日期</span>
                    <span className="font-medium text-gray-800">{newDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">改期费</span>
                    <span className="font-medium text-orange-600">
                      {result.fee ? formatCurrency(result.fee) : '待计算'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">改期申请失败</h3>
                <p className="text-gray-500 mb-6">{result?.message}</p>
              </>
            )}
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
            >
              确定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
