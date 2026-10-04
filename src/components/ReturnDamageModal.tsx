import React, { useState, useEffect, useMemo } from 'react';
import {
  XIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  PackageIcon,
  InfoIcon,
  LayersIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export interface SubProductItem {
  subItemId: number;
  subItemName: string;
  qtyPerPack: number;
  totalQty: number;
  returnQty: number;
  damageQty: number;
  damageReason: string;
  unitType?: string;
}

export interface ReturnDamageItem {
  orderDetailId: number;
  itemId: number;
  itemName: string;
  unitPrice: number;
  totalQty: number;
  returnQty: number;
  damageQty: number;
  damageReason: string;
  isBudgetPack?: boolean;
  subProducts?: SubProductItem[];
}

export interface ModalOrderData {
  deliveryId: number;
  orderId?: number;
  orderCode?: string;
  customerName?: string;
  phoneOne?: string;
  statusId: number;
  totalAmount?: number;
  cod?: number;
}

interface ReturnDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ModalOrderData | null;
  initialAction?: 'return' | 'damage';
  onSuccess: (targetStatusId: number, summaryNote: string) => Promise<void> | void;
}

const COMMON_DAMAGE_REASONS = [
  'Broken during transit',
  'Leaking / Liquid spill',
  'Damaged packaging / Box crushed',
  'Seal broken / Tampered',
  'Expired / Defective',
  'Other',
];

export const ReturnDamageModal: React.FC<ReturnDamageModalProps> = ({
  isOpen,
  onClose,
  order,
  initialAction = 'return',
  onSuccess,
}) => {
  const [items, setItems] = useState<ReturnDamageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number>(initialAction === 'damage' ? 16 : 6);
  const [additionalNote, setAdditionalNote] = useState('');

  // Fetch items when modal opens
  useEffect(() => {
    if (!isOpen || !order) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      setIsSubmitting(false);
      setAdditionalNote('');
      return;
    }

    setSelectedStatusId(initialAction === 'damage' ? 16 : 6);
    setIsLoading(true);
    setError(null);

    const fetchOrderItems = async () => {
      try {
        let loadedItems: any[] = [];

        // Primary endpoint: order details by orderId
        if (order.orderId) {
          const res = await fetch(`${API_BASE_URL}/api/sales/orders/${order.orderId}/items`);
          if (res.ok && res.status !== 204) {
            loadedItems = await res.json();
          }
        }

        // Fallback: items by deliveryId if orderId returned empty
        if (!loadedItems || loadedItems.length === 0) {
          const res = await fetch(`${API_BASE_URL}/api/sales/delivery-orders/${order.deliveryId}/items`);
          if (res.ok && res.status !== 204) {
            loadedItems = await res.json();
          }
        }

        if (!loadedItems || loadedItems.length === 0) {
          setError('No items found for this order. Status will be applied to the order directly.');
          setItems([]);
          return;
        }

        const isInitDamage = initialAction === 'damage';

        const mapped: ReturnDamageItem[] = await Promise.all(
          loadedItems.map(async (item: any) => {
            const qty = Number(item.quantity || 1);
            let isBudgetPack = false;
            let subProducts: SubProductItem[] = [];

            try {
              const tplRes = await fetch(`${API_BASE_URL}/api/item-templates/${item.itemId}`);
              if (tplRes.ok) {
                const tpl = await tplRes.json();
                if (tpl && Array.isArray(tpl.ingredients) && tpl.ingredients.length > 0) {
                  isBudgetPack = true;
                  subProducts = tpl.ingredients.map((ing: any) => {
                    const qtyPerPack = Number(ing.quantity || 1);
                    const subTotalQty = qtyPerPack * qty;
                    return {
                      subItemId: Number(ing.subItemId),
                      subItemName: ing.subItemName || `Item #${ing.subItemId}`,
                      qtyPerPack,
                      totalQty: subTotalQty,
                      returnQty: isInitDamage ? 0 : subTotalQty,
                      damageQty: isInitDamage ? subTotalQty : 0,
                      damageReason: '',
                      unitType: ing.unitType || '',
                    };
                  });
                }
              }
            } catch (e) {
              console.warn(`Could not check template for item ${item.itemId}:`, e);
            }

            return {
              orderDetailId: item.orderDetailId ?? 0,
              itemId: item.itemId,
              itemName: item.itemName || `Item #${item.itemId}`,
              unitPrice: Number(item.perItemPrice || item.unitPrice || 0),
              totalQty: qty,
              returnQty: isInitDamage ? 0 : qty,
              damageQty: isInitDamage ? qty : 0,
              damageReason: '',
              isBudgetPack,
              subProducts,
            };
          })
        );

        setItems(mapped);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load order items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderItems();
  }, [isOpen, order, initialAction]);

  // Handle regular item Return Qty change -> automatically balance Damage Qty
  const handleReturnQtyChange = (index: number, val: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      const safeReturn = Math.max(0, Math.min(item.totalQty, val));
      item.returnQty = safeReturn;
      item.damageQty = item.totalQty - safeReturn;
      next[index] = item;
      return next;
    });
  };

  // Handle regular item Damage Qty change -> automatically balance Return Qty
  const handleDamageQtyChange = (index: number, val: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      const safeDamage = Math.max(0, Math.min(item.totalQty, val));
      item.damageQty = safeDamage;
      item.returnQty = item.totalQty - safeDamage;
      next[index] = item;
      return next;
    });
  };

  const handleReasonChange = (index: number, reason: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], damageReason: reason };
      return next;
    });
  };

  // Budget Pack sub-product handlers
  const handleSubProductReturnQtyChange = (itemIndex: number, subIndex: number, val: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      if (!item.subProducts) return prev;

      const subProducts = [...item.subProducts];
      const sub = { ...subProducts[subIndex] };
      const safeReturn = Math.max(0, Math.min(sub.totalQty, val));
      sub.returnQty = safeReturn;
      sub.damageQty = sub.totalQty - safeReturn;
      subProducts[subIndex] = sub;
      item.subProducts = subProducts;

      // Update parent item return/damage summary
      const allSubsReturned = subProducts.every((s) => s.returnQty === s.totalQty);
      const allSubsDamaged = subProducts.every((s) => s.damageQty === s.totalQty);
      if (allSubsReturned) {
        item.returnQty = item.totalQty;
        item.damageQty = 0;
      } else if (allSubsDamaged) {
        item.returnQty = 0;
        item.damageQty = item.totalQty;
      } else {
        const totalSub = subProducts.reduce((sum, s) => sum + s.totalQty, 0);
        const retSub = subProducts.reduce((sum, s) => sum + s.returnQty, 0);
        const ratio = totalSub > 0 ? retSub / totalSub : 0;
        item.returnQty = Math.round(item.totalQty * ratio);
        item.damageQty = item.totalQty - item.returnQty;
      }

      next[itemIndex] = item;
      return next;
    });
  };

  const handleSubProductDamageQtyChange = (itemIndex: number, subIndex: number, val: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      if (!item.subProducts) return prev;

      const subProducts = [...item.subProducts];
      const sub = { ...subProducts[subIndex] };
      const safeDamage = Math.max(0, Math.min(sub.totalQty, val));
      sub.damageQty = safeDamage;
      sub.returnQty = sub.totalQty - safeDamage;
      subProducts[subIndex] = sub;
      item.subProducts = subProducts;

      // Update parent item return/damage summary
      const allSubsReturned = subProducts.every((s) => s.returnQty === s.totalQty);
      const allSubsDamaged = subProducts.every((s) => s.damageQty === s.totalQty);
      if (allSubsReturned) {
        item.returnQty = item.totalQty;
        item.damageQty = 0;
      } else if (allSubsDamaged) {
        item.returnQty = 0;
        item.damageQty = item.totalQty;
      } else {
        const totalSub = subProducts.reduce((sum, s) => sum + s.totalQty, 0);
        const retSub = subProducts.reduce((sum, s) => sum + s.returnQty, 0);
        const ratio = totalSub > 0 ? retSub / totalSub : 0;
        item.returnQty = Math.round(item.totalQty * ratio);
        item.damageQty = item.totalQty - item.returnQty;
      }

      next[itemIndex] = item;
      return next;
    });
  };

  const handleSubProductReasonChange = (itemIndex: number, subIndex: number, reason: string) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      if (!item.subProducts) return prev;

      const subProducts = [...item.subProducts];
      subProducts[subIndex] = { ...subProducts[subIndex], damageReason: reason };
      item.subProducts = subProducts;
      next[itemIndex] = item;
      return next;
    });
  };

  const handlePackMarkAllReturn = (itemIndex: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      item.returnQty = item.totalQty;
      item.damageQty = 0;
      if (item.subProducts) {
        item.subProducts = item.subProducts.map((s) => ({
          ...s,
          returnQty: s.totalQty,
          damageQty: 0,
        }));
      }
      next[itemIndex] = item;
      return next;
    });
  };

  const handlePackMarkAllDamage = (itemIndex: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      item.returnQty = 0;
      item.damageQty = item.totalQty;
      if (item.subProducts) {
        item.subProducts = item.subProducts.map((s) => ({
          ...s,
          returnQty: 0,
          damageQty: s.totalQty,
        }));
      }
      next[itemIndex] = item;
      return next;
    });
  };

  // Quick actions: Mark All as Return or Mark All as Damage (including all sub-products)
  const handleMarkAllReturn = () => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        returnQty: i.totalQty,
        damageQty: 0,
        subProducts: i.subProducts?.map((s) => ({
          ...s,
          returnQty: s.totalQty,
          damageQty: 0,
        })),
      }))
    );
    setSelectedStatusId(6);
  };

  const handleMarkAllDamage = () => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        returnQty: 0,
        damageQty: i.totalQty,
        subProducts: i.subProducts?.map((s) => ({
          ...s,
          returnQty: 0,
          damageQty: s.totalQty,
        })),
      }))
    );
    setSelectedStatusId(16);
  };

  // Calculate totals across regular items and Budget Pack sub-products
  const totals = useMemo(() => {
    let totalUnits = 0;
    let totalReturn = 0;
    let totalDamage = 0;
    let returnAmount = 0;
    let damageAmount = 0;

    for (const item of items) {
      if (item.isBudgetPack && item.subProducts && item.subProducts.length > 0) {
        const packSubTotal = item.subProducts.reduce((sum, s) => sum + s.totalQty, 0);
        const packSubReturn = item.subProducts.reduce((sum, s) => sum + s.returnQty, 0);
        const packSubDamage = item.subProducts.reduce((sum, s) => sum + s.damageQty, 0);

        totalUnits += packSubTotal;
        totalReturn += packSubReturn;
        totalDamage += packSubDamage;

        if (packSubTotal > 0) {
          returnAmount += (packSubReturn / packSubTotal) * (item.unitPrice * item.totalQty);
          damageAmount += (packSubDamage / packSubTotal) * (item.unitPrice * item.totalQty);
        }
      } else {
        totalUnits += item.totalQty;
        totalReturn += item.returnQty;
        totalDamage += item.damageQty;
        returnAmount += item.returnQty * item.unitPrice;
        damageAmount += item.damageQty * item.unitPrice;
      }
    }

    const isAllReturn = totalReturn === totalUnits && totalUnits > 0;
    const isAllDamage = totalDamage === totalUnits && totalUnits > 0;
    const isMixed = totalReturn > 0 && totalDamage > 0;

    return {
      totalUnits,
      totalReturn,
      totalDamage,
      returnAmount,
      damageAmount,
      isAllReturn,
      isAllDamage,
      isMixed,
    };
  }, [items]);

  // Automatically sync suggested order status when items are pure return or pure damage
  useEffect(() => {
    if (totals.isAllReturn) {
      setSelectedStatusId(6);
    } else if (totals.isAllDamage) {
      setSelectedStatusId(16);
    }
  }, [totals.isAllReturn, totals.isAllDamage]);

  // Submit Handler
  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError(null);

    const loggedInUserId = localStorage.getItem('userId');
    const effectiveUserId = loggedInUserId ? parseInt(loggedInUserId, 10) : 1;
    const userIdParam = loggedInUserId ? `&userId=${loggedInUserId}` : '';

    try {
      // 1. Build inspection report string
      const itemLines: string[] = [];
      for (const item of items) {
        if (item.isBudgetPack && item.subProducts && item.subProducts.length > 0) {
          const subLines: string[] = [];
          for (const sub of item.subProducts) {
            const reasonStr = sub.damageReason ? ` (${sub.damageReason})` : '';
            if (sub.returnQty > 0 && sub.damageQty > 0) {
              subLines.push(`${sub.subItemName}: ${sub.returnQty} Ret, ${sub.damageQty} Dmg${reasonStr}`);
            } else if (sub.returnQty > 0) {
              subLines.push(`${sub.subItemName}: ${sub.returnQty} Ret`);
            } else if (sub.damageQty > 0) {
              subLines.push(`${sub.subItemName}: ${sub.damageQty} Dmg${reasonStr}`);
            }
          }
          itemLines.push(`${item.itemName} [${subLines.join(', ')}]`);
        } else {
          const reasonStr = item.damageReason ? ` (${item.damageReason})` : '';
          if (item.returnQty > 0 && item.damageQty > 0) {
            itemLines.push(`${item.itemName}: ${item.returnQty} Return, ${item.damageQty} Damage${reasonStr}`);
          } else if (item.returnQty > 0) {
            itemLines.push(`${item.itemName}: ${item.returnQty} Return`);
          } else if (item.damageQty > 0) {
            itemLines.push(`${item.itemName}: ${item.damageQty} Damage${reasonStr}`);
          }
        }
      }

      const statusName = selectedStatusId === 16 ? 'Damage' : 'Return';
      const timestamp = new Date().toLocaleString();
      let inspectionReport = `[${timestamp} ${statusName} Inspection]: ${itemLines.join(' | ')}`;
      if (additionalNote.trim()) {
        inspectionReport += ` [Note: ${additionalNote.trim()}]`;
      }

      // 2. Update order status
      const statusRes = await fetch(
        `${API_BASE_URL}/api/sales/${order.deliveryId}/status?statusId=${selectedStatusId}${userIdParam}`,
        { method: 'PATCH' }
      );
      if (!statusRes.ok) {
        const errText = await statusRes.text();
        throw new Error(errText || `Failed to update order status (${statusRes.status})`);
      }

      // 3. Append inspection report to Order Remark
      try {
        const getRemarkRes = await fetch(`${API_BASE_URL}/api/sales/${order.deliveryId}/remark`);
        const existingRemark = getRemarkRes.ok ? await getRemarkRes.text() : '';
        const updatedRemark = existingRemark?.trim()
          ? `${existingRemark.trim()}\n${inspectionReport}`
          : inspectionReport;

        await fetch(`${API_BASE_URL}/api/sales/${order.deliveryId}/remark`, {
          method: 'PUT',
          headers: { 'Content-Type': 'text/plain' },
          body: updatedRemark,
        });
      } catch (e) {
        console.warn('Could not append inspection report to remark:', e);
      }

      // 4. Update individual order detail remarks (if orderDetailId exists)
      for (const item of items) {
        if (item.orderDetailId > 0) {
          let itemCondition = '';
          if (item.isBudgetPack && item.subProducts && item.subProducts.length > 0) {
            const subParts: string[] = [];
            for (const sub of item.subProducts) {
              const reasonStr = sub.damageReason ? ` (${sub.damageReason})` : '';
              if (sub.returnQty > 0 && sub.damageQty > 0) {
                subParts.push(`${sub.subItemName}: Ret ${sub.returnQty}, Dmg ${sub.damageQty}${reasonStr}`);
              } else if (sub.returnQty > 0) {
                subParts.push(`${sub.subItemName}: Return (${sub.returnQty})`);
              } else if (sub.damageQty > 0) {
                subParts.push(`${sub.subItemName}: Damage (${sub.damageQty})${reasonStr}`);
              }
            }
            itemCondition = subParts.join(' | ');
          } else {
            if (item.returnQty > 0 && item.damageQty > 0) {
              itemCondition = `Return: ${item.returnQty}, Damage: ${item.damageQty}${item.damageReason ? ` (${item.damageReason})` : ''}`;
            } else if (item.returnQty > 0) {
              itemCondition = `Return: ${item.returnQty}`;
            } else {
              itemCondition = `Damage: ${item.damageQty}${item.damageReason ? ` (${item.damageReason})` : ''}`;
            }
          }

          if (itemCondition) {
            fetch(`${API_BASE_URL}/api/sales/orders/items/${item.orderDetailId}/remark`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'text/plain' },
              body: itemCondition,
            }).catch(() => {});
          }
        }
      }

      // 5. Callback and close
      await onSuccess(selectedStatusId, inspectionReport);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'An error occurred while saving the inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-in fade-in zoom-in duration-150">
        {/* ── Header ── */}
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 px-5 py-3.5 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <LayersIcon className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Return & Damage Product Inspection</h3>
              <p className="text-xs text-teal-200">
                Order: <span className="font-semibold text-white">{order.orderCode || `#${order.deliveryId}`}</span>
                {order.customerName && ` · Customer: ${order.customerName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── Content Body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 custom-scrollbar">
          {/* Instructions banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
            <InfoIcon className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
            <div>
              <p className="font-semibold">Per-Item Inspection for Returning Parcels</p>
              <p className="text-teal-800 mt-0.5">
                Specify the exact returned (undamaged) and damaged quantities for each item below. For Budget Packs, you can inspect each included product individually.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500 text-sm">
              <RefreshCwIcon className="h-6 w-6 animate-spin text-teal-600" />
              <span>Loading order items…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No products found for this order.
            </div>
          ) : (
            <>
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order Items ({items.length}) · Total Product Units: {totals.totalUnits}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllReturn}
                    className="flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-100 transition-colors shadow-xs"
                  >
                    <RotateCcwIcon className="h-3.5 w-3.5" />
                    Mark All as Return
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkAllDamage}
                    className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-xs"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5" />
                    Mark All as Damage
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Product Name</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Ordered</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-pink-700">
                        <span className="inline-flex items-center gap-1">
                          <RotateCcwIcon className="h-3 w-3" /> Return Qty
                        </span>
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold text-orange-700">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangleIcon className="h-3 w-3" /> Damage Qty
                        </span>
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {items.map((item, idx) => {
                      if (item.isBudgetPack && item.subProducts && item.subProducts.length > 0) {
                        const allSubsReturned = item.subProducts.every((s) => s.returnQty === s.totalQty);
                        const allSubsDamaged = item.subProducts.every((s) => s.damageQty === s.totalQty);
                        const subReturnCount = item.subProducts.reduce((s, p) => s + p.returnQty, 0);
                        const subDamageCount = item.subProducts.reduce((s, p) => s + p.damageQty, 0);
                        const subTotalCount = item.subProducts.reduce((s, p) => s + p.totalQty, 0);

                        return (
                          <React.Fragment key={item.orderDetailId || item.itemId}>
                            {/* Budget Pack Header Row */}
                            <tr className="bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white border-t border-purple-200">
                              <td className="px-3 py-2.5 text-purple-700 font-bold">{idx + 1}</td>
                              <td className="px-3 py-2.5" colSpan={2}>
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-200/80 text-purple-800 text-xs">
                                    📦
                                  </span>
                                  <span className="font-bold text-gray-900 text-xs">{item.itemName}</span>
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                                    Budget Pack · {item.subProducts.length} Products Inside
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5 pl-7">
                                  Rs. {item.unitPrice.toFixed(2)} / pack · Ordered: <strong className="text-gray-800">{item.totalQty} pack{item.totalQty > 1 ? 's' : ''}</strong> ({subTotalCount} units total)
                                </div>
                              </td>
                              {/* Quick pack-level presets */}
                              <td className="px-3 py-2.5 text-center" colSpan={2}>
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePackMarkAllReturn(idx)}
                                    className="rounded px-2.5 py-1 text-[11px] font-semibold bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors border border-pink-200 shadow-2xs"
                                  >
                                    Pack All Return
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePackMarkAllDamage(idx)}
                                    className="rounded px-2.5 py-1 text-[11px] font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors border border-orange-200 shadow-2xs"
                                  >
                                    Pack All Damage
                                  </button>
                                </div>
                              </td>
                              {/* Pack condition status */}
                              <td className="px-3 py-2.5 text-center">
                                {allSubsReturned ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-semibold text-pink-800 border border-pink-200">
                                    <CheckCircleIcon className="h-3 w-3" /> All Return
                                  </span>
                                ) : allSubsDamaged ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800 border border-orange-200">
                                    <AlertTriangleIcon className="h-3 w-3" /> All Damage
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
                                    Mixed ({subReturnCount} Ret / {subDamageCount} Dmg)
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Sub-product Rows */}
                            {item.subProducts.map((sub, subIdx) => {
                              const isSubFullReturn = sub.returnQty === sub.totalQty;
                              const isSubFullDamage = sub.damageQty === sub.totalQty;
                              const isSubSplit = sub.returnQty > 0 && sub.damageQty > 0;

                              return (
                                <tr
                                  key={`${item.itemId}-sub-${sub.subItemId}-${subIdx}`}
                                  className="bg-purple-50/15 hover:bg-purple-50/35 transition-colors border-l-4 border-l-purple-400"
                                >
                                  <td className="px-3 py-2 text-right text-gray-400 font-mono text-[11px]">
                                    {idx + 1}.{subIdx + 1}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5 pl-2">
                                      <span className="text-purple-500 font-bold text-xs">↳</span>
                                      <span className="font-semibold text-gray-800 text-xs">{sub.subItemName}</span>
                                      {sub.unitType && (
                                        <span className="text-[10px] text-gray-400">({sub.unitType})</span>
                                      )}
                                    </div>
                                    {/* Damage reason dropdown when damageQty > 0 */}
                                    {sub.damageQty > 0 && (
                                      <div className="mt-1 pl-5">
                                        <select
                                          value={sub.damageReason}
                                          onChange={(e) => handleSubProductReasonChange(idx, subIdx, e.target.value)}
                                          className="h-6 text-[10px] rounded border border-orange-200 bg-orange-50/60 px-2 py-0.5 text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                        >
                                          <option value="">Select damage reason (optional)…</option>
                                          {COMMON_DAMAGE_REASONS.map((r) => (
                                            <option key={r} value={r}>
                                              {r}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-bold text-gray-700">
                                    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-gray-100 px-1 text-[11px] font-semibold text-gray-800">
                                      {sub.totalQty}
                                    </span>
                                  </td>
                                  {/* Sub-item Return Qty */}
                                  <td className="px-3 py-2 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSubProductReturnQtyChange(idx, subIdx, sub.returnQty - 1)}
                                        disabled={sub.returnQty <= 0}
                                        className="h-5 w-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        max={sub.totalQty}
                                        value={sub.returnQty}
                                        onChange={(e) =>
                                          handleSubProductReturnQtyChange(idx, subIdx, parseInt(e.target.value, 10) || 0)
                                        }
                                        className="h-6 w-10 rounded border border-pink-300 bg-pink-50/40 text-center text-xs font-bold text-pink-700 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSubProductReturnQtyChange(idx, subIdx, sub.returnQty + 1)}
                                        disabled={sub.returnQty >= sub.totalQty}
                                        className="h-5 w-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  {/* Sub-item Damage Qty */}
                                  <td className="px-3 py-2 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSubProductDamageQtyChange(idx, subIdx, sub.damageQty - 1)}
                                        disabled={sub.damageQty <= 0}
                                        className="h-5 w-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        max={sub.totalQty}
                                        value={sub.damageQty}
                                        onChange={(e) =>
                                          handleSubProductDamageQtyChange(idx, subIdx, parseInt(e.target.value, 10) || 0)
                                        }
                                        className="h-6 w-10 rounded border border-orange-300 bg-orange-50/40 text-center text-xs font-bold text-orange-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSubProductDamageQtyChange(idx, subIdx, sub.damageQty + 1)}
                                        disabled={sub.damageQty >= sub.totalQty}
                                        className="h-5 w-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  {/* Sub-item Condition Badge */}
                                  <td className="px-3 py-2 text-center">
                                    {isSubFullReturn && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-800">
                                        <CheckCircleIcon className="h-2.5 w-2.5" /> Return ({sub.returnQty})
                                      </span>
                                    )}
                                    {isSubFullDamage && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
                                        <AlertTriangleIcon className="h-2.5 w-2.5" /> Damage ({sub.damageQty})
                                      </span>
                                    )}
                                    {isSubSplit && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                                        Ret: {sub.returnQty} / Dmg: {sub.damageQty}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }

                      // Regular Item
                      const isFullReturn = item.returnQty === item.totalQty;
                      const isFullDamage = item.damageQty === item.totalQty;
                      const isSplit = item.returnQty > 0 && item.damageQty > 0;

                      return (
                        <tr key={item.orderDetailId || item.itemId} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-3 py-3 text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">
                            <div>{item.itemName}</div>
                            <div className="text-[11px] text-gray-400">Rs. {item.unitPrice.toFixed(2)} / unit</div>
                            {/* Damage reason field when damageQty > 0 */}
                            {item.damageQty > 0 && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <select
                                  value={item.damageReason}
                                  onChange={(e) => handleReasonChange(idx, e.target.value)}
                                  className="h-7 text-[11px] rounded border border-orange-200 bg-orange-50/50 px-2 py-0.5 text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                >
                                  <option value="">Select damage reason (optional)…</option>
                                  {COMMON_DAMAGE_REASONS.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gray-700">
                            <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-gray-100 px-1.5 text-xs font-semibold text-gray-800">
                              {item.totalQty}
                            </span>
                          </td>
                          {/* Return Qty Control */}
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleReturnQtyChange(idx, item.returnQty - 1)}
                                disabled={item.returnQty <= 0}
                                className="h-6 w-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={item.totalQty}
                                value={item.returnQty}
                                onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                                className="h-7 w-12 rounded border border-pink-300 bg-pink-50/30 text-center text-xs font-bold text-pink-700 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleReturnQtyChange(idx, item.returnQty + 1)}
                                disabled={item.returnQty >= item.totalQty}
                                className="h-6 w-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {/* Damage Qty Control */}
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDamageQtyChange(idx, item.damageQty - 1)}
                                disabled={item.damageQty <= 0}
                                className="h-6 w-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={item.totalQty}
                                value={item.damageQty}
                                onChange={(e) => handleDamageQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                                className="h-7 w-12 rounded border border-orange-300 bg-orange-50/30 text-center text-xs font-bold text-orange-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleDamageQtyChange(idx, item.damageQty + 1)}
                                disabled={item.damageQty >= item.totalQty}
                                className="h-6 w-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {/* Item Condition Badge */}
                          <td className="px-3 py-3 text-center">
                            {isFullReturn && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-semibold text-pink-800">
                                <CheckCircleIcon className="h-3 w-3" /> Return ({item.returnQty})
                              </span>
                            )}
                            {isFullDamage && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800">
                                <AlertTriangleIcon className="h-3 w-3" /> Damage ({item.damageQty})
                              </span>
                            )}
                            {isSplit && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                                Ret: {item.returnQty} / Dmg: {item.damageQty}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Inspection Summary Cards */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-pink-200 bg-pink-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pink-800">Total Return Units</span>
                    <span className="text-base font-bold text-pink-700">{totals.totalReturn}</span>
                  </div>
                  <div className="text-[11px] text-pink-600 mt-1">
                    Value: Rs. {totals.returnAmount.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-800">Total Damaged Units</span>
                    <span className="text-base font-bold text-orange-700">{totals.totalDamage}</span>
                  </div>
                  <div className="text-[11px] text-orange-600 mt-1">
                    Value: Rs. {totals.damageAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Resolution: Overall Order Status */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-gray-800">Overall Order Status</label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {totals.isMixed
                        ? 'This order contains both returned and damaged products. Select how to record the overall order status:'
                        : 'Final status applied to the order:'}
                    </p>
                  </div>
                  {totals.isMixed && (
                    <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                      Mixed Order
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-pink-400 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50/40 has-[:checked]:text-pink-800 transition-all flex-1">
                    <input
                      type="radio"
                      name="orderStatusOption"
                      value={6}
                      checked={selectedStatusId === 6}
                      onChange={() => setSelectedStatusId(6)}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <RotateCcwIcon className="h-4 w-4 text-pink-600" />
                    <span>Return (Status 6)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-orange-400 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50/40 has-[:checked]:text-orange-800 transition-all flex-1">
                    <input
                      type="radio"
                      name="orderStatusOption"
                      value={16}
                      checked={selectedStatusId === 16}
                      onChange={() => setSelectedStatusId(16)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                    <span>Damage (Status 16)</span>
                  </label>
                </div>

                {/* Additional Note */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="Optional inspection remark / courier claim note…"
                    className="h-8 w-full rounded-md border border-gray-300 bg-white px-3 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3 shrink-0">
          <div className="text-xs text-gray-500">
            {totals.totalUnits > 0 && (
              <span>
                Processed: <strong className="text-gray-800">{totals.totalReturn}</strong> returned,{' '}
                <strong className="text-gray-800">{totals.totalDamage}</strong> damaged
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading || items.length === 0}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedStatusId === 16 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                  Saving Inspection…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Confirm & Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
