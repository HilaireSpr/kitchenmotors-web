"use client";

import { useMemo, useState, type CSSProperties } from "react";
import PlannerTest from "@/components/planner-test";
import ImportRecipes from "@/components/recipes";
import MenuItems from "@/components/menu-items";
import PlanningOverview from "@/components/planning-overview";
import BaseData from "@/components/base-data";
import { colors } from "@/styles/colors";

type DashboardTabsProps = {
  userEmail: string;
  apiStatus: string;
};

type DashboardTab = "basisdata" | "recepten" | "menu" | "planner" | "overzicht";

type TabConfig = {
  key: DashboardTab;
  label: string;
  description: string;
};

const TABS: TabConfig[] = [
  {
    key: "basisdata",
    label: "Basisdata",
    description: "Posten, toestellen en basisinstellingen",
  },
  {
    key: "recepten",
    label: "Recepten",
    description: "Recepten, handelingen en vaste taken",
  },
  {
    key: "menu",
    label: "Menu",
    description: "Menu-opbouw per groep, dag en cyclus",
  },
  {
    key: "planner",
    label: "Planner",
    description: "Planning genereren en bijsturen",
  },
  {
    key: "overzicht",
    label: "Overzicht & Print",
    description: "Controle, dagoverzicht en print",
  },
];

const shellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "272px minmax(0, 1fr)",
  gap: 24,
  minHeight: "calc(100vh - 48px)",
};

const sidebarCardStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  borderRadius: 20,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  position: "sticky",
  top: 24,
  height: "calc(100vh - 48px)",
};

const mainCardStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  borderRadius: 20,
};

export default function DashboardTabs({
  userEmail,
  apiStatus,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("recepten");

  const activeTabConfig = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) ?? TABS[0],
    [activeTab]
  );

  function renderActiveTab() {
    switch (activeTab) {
      case "basisdata":
        return <BaseData />;
      case "recepten":
        return <ImportRecipes />;
      case "menu":
        return <MenuItems />;
      case "planner":
        return <PlannerTest />;
      case "overzicht":
        return <PlanningOverview />;
      default:
        return null;
    }
  }

  return (
    <div style={shellStyle}>
      <aside style={sidebarCardStyle}>
        <div
          style={{
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: colors.text,
            }}
          >
            Kitchen
            <br />
            Motors
          </div>

          <div
            style={{
              fontSize: 14,
              color: colors.textMuted,
              lineHeight: 1.5,
            }}
          >
            Productieplanning voor grootkeukens
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: `1px solid ${
                    isActive ? colors.selectedBorder : "transparent"
                  }`,
                  background: isActive ? colors.selectedBg : colors.bg,
                  color: colors.text,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 6px 20px rgba(0,0,0,0.04)" : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 600,
                    color: colors.text,
                  }}
                >
                  {tab.label}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: colors.textMuted,
                  }}
                >
                  {tab.description}
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            border: `1px solid ${colors.border}`,
            background: colors.bgMuted,
            borderRadius: 16,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.text,
                  wordBreak: "break-word",
                }}
              >
                {userEmail}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                Ingelogd
              </div>
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background:
                  apiStatus.toLowerCase() === "ok"
                    ? "rgba(22, 163, 74, 0.12)"
                    : colors.overrideBg,
                color:
                  apiStatus.toLowerCase() === "ok"
                    ? colors.success
                    : colors.warning,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              API {apiStatus}
            </div>
          </div>

          <form action="/logout" method="post">
            <button
              type="submit"
              className="button"
              style={{
                width: "100%",
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              Uitloggen
            </button>
          </form>
        </div>
      </aside>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...mainCardStyle,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            minHeight: 112,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: colors.primary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Kitchen planning tool
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: colors.text,
              }}
            >
              {activeTabConfig.label}
            </h1>

            <p
              style={{
                margin: "10px 0 0 0",
                color: colors.textMuted,
                fontSize: 16,
                lineHeight: 1.5,
                maxWidth: 760,
              }}
            >
              {activeTabConfig.description}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                background: colors.bgMuted,
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Warm planning interface
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: activeTab === "basisdata" ? "block" : "none" }}>
            <BaseData />
          </div>

          <div style={{ display: activeTab === "recepten" ? "block" : "none" }}>
            <ImportRecipes />
          </div>

          <div style={{ display: activeTab === "menu" ? "block" : "none" }}>
            <MenuItems />
          </div>

          <div style={{ display: activeTab === "planner" ? "block" : "none" }}>
            <PlannerTest />
          </div>

          <div style={{ display: activeTab === "overzicht" ? "block" : "none" }}>
            <PlanningOverview />
          </div>
        </div>
      </main>
    </div>
  );
}