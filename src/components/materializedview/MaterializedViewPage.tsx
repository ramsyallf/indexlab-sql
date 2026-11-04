import React from 'react';
import { PageHeader } from '../ui/primitives';
import { MvIntroSection } from './MvIntroSection';
import { MvProcessFlowSection } from './MvProcessFlowSection';
import { MvSimulatorSection } from './MvSimulatorSection';
import { MvSqlPlaygroundSection } from './MvSqlPlaygroundSection';
import { MvComparisonSection } from './MvComparisonSection';
import { MvTradeoffsUseCasesSection } from './MvTradeoffsUseCasesSection';
import { MvAdvancedPostgresSection } from './MvAdvancedPostgresSection';

export const MaterializedViewPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Materialized View"
        subtitle={
          <span className="block text-justify">
            Pahami bagaimana PostgreSQL menyimpan hasil query secara fisik untuk meningkatkan performa query berulang melalui visualisasi interaktif.
          </span>
        }
      />

      {/* SECTION A — Introduction to Materialized View */}
      <section id="intro">
        <MvIntroSection />
      </section>

      {/* SECTION B — How Materialized View Works */}
      <section id="process">
        <MvProcessFlowSection />
      </section>

      {/* SECTION C — Interactive Materialized View Simulator (Priority) */}
      <section id="simulator">
        <MvSimulatorSection />
      </section>

      {/* SECTION D — SQL Playground / SQL Syntax */}
      <section id="sql">
        <MvSqlPlaygroundSection />
      </section>

      {/* SECTION E — View vs Materialized View vs Index */}
      <section id="comparison">
        <MvComparisonSection />
      </section>

      {/* SECTION F — Advantages, Limitations, and Use Cases */}
      <section id="tradeoffs">
        <MvTradeoffsUseCasesSection />
      </section>

      {/* SECTION G — Important PostgreSQL Details */}
      <section id="advanced">
        <MvAdvancedPostgresSection />
      </section>
    </div>
  );
};
