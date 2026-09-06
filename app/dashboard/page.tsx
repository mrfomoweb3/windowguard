import type { Metadata } from "next";
import { TradingWorkbench } from "@/components/trading-workbench";

export const metadata: Metadata = {
  title: "Dashboard | WindowGuard",
  description: "Review and submit protected dreamDEX Event Contract orders.",
};

export default function DashboardPage() {
  return <TradingWorkbench />;
}
