import { describe, it, expect } from 'vitest';
import { formatRupiah, Transaction } from '../../components/materializedview/MvSimulatorSection';

describe('Materialized View Simulation Logic', () => {
  const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 1, product: 'Laptop', amount: 5000000 },
    { id: 2, product: 'Mouse', amount: 200000 },
    { id: 3, product: 'Keyboard', amount: 500000 },
    { id: 4, product: 'Monitor', amount: 2000000 },
    { id: 5, product: 'Headset', amount: 300000 },
  ];

  it('calculates initial source metrics correctly', () => {
    const totalSales = INITIAL_TRANSACTIONS.reduce((acc, curr) => acc + curr.amount, 0);
    expect(INITIAL_TRANSACTIONS.length).toBe(5);
    expect(totalSales).toBe(8000000);
  });

  it('formats Indonesian Rupiah properly', () => {
    const formatted = formatRupiah(8000000);
    // Should contain Rp and 8.000.000
    expect(formatted).toContain('Rp');
    expect(formatted.replace(/\s/g, '')).toMatch(/8\.000\.000/);
  });

  it('detects staleness when source table adds new transaction', () => {
    let sourceData = [...INITIAL_TRANSACTIONS];
    const mvData = { totalTransactions: 5, totalSales: 8000000 };

    // Initially synced
    let isStale =
      sourceData.length !== mvData.totalTransactions ||
      sourceData.reduce((acc, curr) => acc + curr.amount, 0) !== mvData.totalSales;
    expect(isStale).toBe(false);

    // Add transaction of Rp2.000.000
    sourceData.push({ id: 6, product: 'Monitor Ultrawide', amount: 2000000 });

    const sourceTotal = sourceData.reduce((acc, curr) => acc + curr.amount, 0);
    expect(sourceTotal).toBe(10000000);
    expect(sourceData.length).toBe(6);

    // Materialized View remains 8.000.000 and 5
    expect(mvData.totalSales).toBe(8000000);
    expect(mvData.totalTransactions).toBe(5);

    // Stale check must be true
    isStale =
      sourceData.length !== mvData.totalTransactions ||
      sourceTotal !== mvData.totalSales;
    expect(isStale).toBe(true);
  });

  it('refreshes materialized view to synchronize with source table', () => {
    const sourceData = [
      ...INITIAL_TRANSACTIONS,
      { id: 6, product: 'Printer Laser', amount: 3200000 },
    ];
    let mvData = { totalTransactions: 5, totalSales: 8000000 };

    // Refresh execution
    mvData = {
      totalTransactions: sourceData.length,
      totalSales: sourceData.reduce((acc, curr) => acc + curr.amount, 0),
    };

    expect(mvData.totalTransactions).toBe(6);
    expect(mvData.totalSales).toBe(11200000);

    const isStale =
      sourceData.length !== mvData.totalTransactions ||
      sourceData.reduce((acc, curr) => acc + curr.amount, 0) !== mvData.totalSales;
    expect(isStale).toBe(false);
  });
});

