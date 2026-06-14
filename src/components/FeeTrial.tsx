import { Calculator, TrendingUp, TrendingDown, ArrowRight, Info } from 'lucide-react';
import type { FeeCalculation } from '@/types';
import { formatCurrency } from '@/utils/feeUtils';
import { cn } from '@/lib/utils';

interface FeeTrialProps {
  calculation: FeeCalculation;
  title?: string;
}

export default function FeeTrial({ calculation, title = '费用试算' }: FeeTrialProps) {
  const hasIncrease = calculation.priceDifference > 0;
  const hasDecrease = calculation.priceDifference < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">改期费用明细</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">原订单总价</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(calculation.originalTotal)}
            </p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl">
            <p className="text-sm text-rose-600 mb-1">改期后总价</p>
            <p className="text-2xl font-bold text-rose-600">
              {formatCurrency(calculation.newTotal)}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">费用明细</h3>
          
          <div className="space-y-2">
            {calculation.details.map((detail, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <span className="text-sm text-gray-600">{detail.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(detail.oldPrice)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-300" />
                  <span className="text-sm font-medium text-gray-800">
                    {formatCurrency(detail.newPrice)}
                  </span>
                  {detail.difference !== 0 && (
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        detail.difference > 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-600'
                      )}
                    >
                      {detail.difference > 0 ? '+' : ''}
                      {formatCurrency(detail.difference)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">价格差额</span>
            <div className="flex items-center gap-1">
              {hasIncrease && <TrendingUp className="w-4 h-4 text-red-500" />}
              {hasDecrease && <TrendingDown className="w-4 h-4 text-green-500" />}
              <span
                className={cn(
                  'font-medium',
                  hasIncrease ? 'text-red-600' : hasDecrease ? 'text-green-600' : 'text-gray-600'
                )}
              >
                {calculation.priceDifference > 0 ? '+' : ''}
                {formatCurrency(calculation.priceDifference)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">改期手续费</span>
            <span className="font-medium text-orange-600">
              +{formatCurrency(calculation.rescheduleFee)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="font-medium text-gray-800">应付尾款</span>
            <span className="text-xl font-bold text-rose-600">
              {formatCurrency(calculation.balanceDue)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <Info className="w-3.5 h-3.5" />
            <span>已支付 {formatCurrency(calculation.paidAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
