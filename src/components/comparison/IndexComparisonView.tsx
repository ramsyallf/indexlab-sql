import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  HardDrive,
  X,
  Zap,
} from 'lucide-react';
import { INDEX_METHODS, INDEX_ORDER } from '../../data/indexCatalog';
import { IndexTypeId } from '../../types';
import { Button, Card, cx, Field, PageHeader, Select, Tag } from '../ui/primitives';

export const IndexComparisonView: React.FC = () => {
  const [leftId, setLeftId] = useState<IndexTypeId>('btree');
  const [rightId, setRightId] = useState<IndexTypeId>('brin');

  const left = INDEX_METHODS[leftId];
  const right = INDEX_METHODS[rightId];

  const capabilityRows = [
    {
      label: 'Equality Lookup (=)',
      leftVal: left.operatorSupportMatrix.equality,
      rightVal: right.operatorSupportMatrix.equality,
    },
    {
      label: 'Range & Comparison (<, <=, >, >=, BETWEEN)',
      leftVal: left.operatorSupportMatrix.comparisonRange,
      rightVal: right.operatorSupportMatrix.comparisonRange,
    },
    {
      label: 'Sorting (ORDER BY ASC / DESC)',
      leftVal: left.operatorSupportMatrix.sortingOrder,
      rightVal: right.operatorSupportMatrix.sortingOrder,
    },
    {
      label: "Prefix Pattern Matching (LIKE 'abc%' / ^@)",
      leftVal: left.operatorSupportMatrix.prefixLike,
      rightVal: right.operatorSupportMatrix.prefixLike,
    },
    {
      label: 'Multi-Value Array / JSONB / Full-Text (@>, &&, @@)',
      leftVal: left.operatorSupportMatrix.fullTextArrayJsonb,
      rightVal: right.operatorSupportMatrix.fullTextArrayJsonb,
    },
    {
      label: 'Geometri / Spasial 2D / Range Overlap (&&, <->)',
      leftVal: left.operatorSupportMatrix.spatialGeometric,
      rightVal: right.operatorSupportMatrix.spatialGeometric,
    },
    {
      label: 'Filter Multi-Kolom Bebas (Tanpa Leading Column)',
      leftVal: left.operatorSupportMatrix.multiColumnArbitrary,
      rightVal: right.operatorSupportMatrix.multiColumnArbitrary,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Index Comparison"
        subtitle="Bandingkan struktur penyimpanan, mekanisme pencarian, kompatibilitas operator, dan trade-off antara dua jenis index PostgreSQL."
      />

      {/* Selectors */}
      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-11">
          <div className="md:col-span-5">
            <Field label="Index Pertama (Kiri)">
              <Select<IndexTypeId>
                value={leftId}
                onChange={setLeftId}
                options={INDEX_ORDER.map((id) => ({
                  value: id,
                  label: INDEX_METHODS[id].name,
                }))}
              />
            </Field>
          </div>

          <div className="flex justify-center pb-1 md:col-span-1">
            <Button
              variant="secondary"
              icon={ArrowLeftRight}
              aria-label="Tukar posisi index"
              onClick={() => {
                setLeftId(rightId);
                setRightId(leftId);
              }}
            />
          </div>

          <div className="md:col-span-5">
            <Field label="Index Kedua (Kanan)">
              <Select<IndexTypeId>
                value={rightId}
                onChange={setRightId}
                options={INDEX_ORDER.map((id) => ({
                  value: id,
                  label: INDEX_METHODS[id].name,
                }))}
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          { spec: left, tagTone: 'accent' as const },
          { spec: right, tagTone: 'ok' as const },
        ].map(({ spec, tagTone }, idx) => (
          <Card key={`${spec.id}-${idx}`} className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-4">
              <div>
                <Tag tone={tagTone}>{spec.badge}</Tag>
                <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-ink">
                  {spec.name}
                </h3>
              </div>
              <Tag tone="neutral">
                Profil: {spec.storageProfile.relativeSize}
              </Tag>
            </div>

            <div className="space-y-4">
              <div>
                <dt className="text-[13px] font-medium text-ink-2">Struktur &amp; Pengorganisasian Data</dt>
                <dd className="mt-1 font-mono text-[13px] font-semibold text-ink">
                  {spec.dataStructureName}
                </dd>
                <dd className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  {spec.howItWorks}
                </dd>
              </div>

              <div>
                <dt className="text-[13px] font-medium text-ink-2">Mekanisme Pencarian</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  {spec.searchMechanism}
                </dd>
              </div>
            </div>

            {/* Storage and write overhead bars */}
            <div className="space-y-3 rounded-2xl bg-fill p-4">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <HardDrive className="h-4 w-4 text-accent" />
                Profil Penyimpanan &amp; Overhead Tulis (Estimasi Konseptual)
              </div>

              <div>
                <div className="flex justify-between text-[12px] text-ink-2">
                  <span>Estimasi Kebutuhan Ruang Disk (Relatif)</span>
                  <span className="font-mono text-ink font-medium">{spec.storageProfile.relativeSize}</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-xs transition-all duration-300"
                    style={{ width: `${spec.storageProfile.sizeScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12px] text-ink-2">
                  <span>Overhead Penulisan (INSERT / UPDATE)</span>
                  <span className="font-mono text-ink font-semibold">{spec.storageProfile.writeOverheadScore} / 100</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-xs transition-all duration-300"
                    style={{ width: `${spec.storageProfile.writeOverheadScore}%` }}
                  />
                </div>
              </div>

              <p className="pt-1 text-[12px] text-ink-2 leading-relaxed">
                {spec.storageProfile.description}
              </p>
            </div>

            {/* Advantages and limitations */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
              <div>
                <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-ok">
                  <Zap className="h-4 w-4" /> Kelebihan
                </h4>
                <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-2">
                  {spec.advantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-bad">
                  <X className="h-4 w-4" /> Keterbatasan
                </h4>
                <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-2">
                  {spec.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bad-fill" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Operator Compatibility Matrix */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-[17px] font-semibold tracking-tight text-ink">
          Matriks Kompatibilitas Pola Query &amp; Operator
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line-soft text-ink-2 text-[13px]">
                <th className="pb-3 pr-4 font-medium">Pola Query / Operator</th>
                <th className="px-4 pb-3 font-semibold text-ink">{left.shortName}</th>
                <th className="px-4 pb-3 font-semibold text-ink">{right.shortName}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {capabilityRows.map((row) => (
                <tr key={row.label} className="hover:bg-fill/40 transition-colors">
                  <td className="py-3.5 pr-4 text-ink font-medium">
                    {row.label}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.leftVal ? (
                      <Tag tone="ok" className="gap-1">
                        <Check className="h-3 w-3" /> Didukung
                      </Tag>
                    ) : (
                      <Tag tone="neutral">
                        Tidak Didukung
                      </Tag>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.rightVal ? (
                      <Tag tone="ok" className="gap-1">
                        <Check className="h-3 w-3" /> Didukung
                      </Tag>
                    ) : (
                      <Tag tone="neutral">
                        Tidak Didukung
                      </Tag>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
