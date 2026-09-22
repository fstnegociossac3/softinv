import type { ElementType } from "react";

import {
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Package,
  Upload,
  Users,
} from "lucide-react";

import { PERMISSIONS, type Permission } from "@/config/permissions";

export type NavigationItem = {
  title: string;

  href: string;

  icon: ElementType;

  permission: Permission;
};

/*
|--------------------------------------------------------------------------
| NAVEGACIÓN USUARIO
|--------------------------------------------------------------------------
*/

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",

    href: "/dashboard",

    icon: LayoutDashboard,

    permission: PERMISSIONS.DASHBOARD_VIEW,
  },

  {
    title: "Importaciones",

    href: "/imports",

    icon: Upload,

    permission: PERMISSIONS.IMPORT_VIEW,
  },

  {
    title: "Inventario",

    href: "/inventory",

    icon: Package,

    permission: PERMISSIONS.INVENTORY_VIEW,
  },

  {
    title: "Análisis IRI",

    href: "/iri",

    icon: ChartNoAxesCombined,

    permission: PERMISSIONS.IRI_VIEW,
  },

  {
    title: "Recomendaciones",

    href: "/recommendations",

    icon: Lightbulb,

    permission: PERMISSIONS.RECOMMENDATION_VIEW,
  },

  {
    title: "Seguimiento",

    href: "/tracking",

    icon: ClipboardCheck,

    permission: PERMISSIONS.TRACKING_VIEW,
  },

  {
    title: "Recuperación",

    href: "/recovery",

    icon: CircleDollarSign,

    permission: PERMISSIONS.RECOVERY_VIEW,
  },

  {
    title: "Reportes",

    href: "/reports",

    icon: FileText,

    permission: PERMISSIONS.REPORT_VIEW,
  },
];

/*
|--------------------------------------------------------------------------
| NAVEGACIÓN ADMINISTRADOR
|--------------------------------------------------------------------------
*/

export const adminNavigationItems: NavigationItem[] = [
  {
    title: "Dashboard",

    href: "/admin",

    icon: LayoutDashboard,

    permission: PERMISSIONS.ADMIN_DASHBOARD_VIEW,
  },

  {
    title: "Empresas",

    href: "/admin/companies",

    icon: Building2,

    permission: PERMISSIONS.COMPANY_VIEW_ANY,
  },

  {
    title: "Usuarios",

    href: "/admin/users",

    icon: Users,

    permission: PERMISSIONS.USER_VIEW_ANY,
  },

  {
    title: "Importaciones",

    href: "/imports",

    icon: Upload,

    permission: PERMISSIONS.IMPORT_VIEW,
  },

  {
    title: "Inventario",

    href: "/inventory",

    icon: Package,

    permission: PERMISSIONS.INVENTORY_VIEW,
  },

  {
    title: "Análisis IRI",

    href: "/iri",

    icon: ChartNoAxesCombined,

    permission: PERMISSIONS.IRI_VIEW,
  },
  {
    title: "Recomendaciones",

    href: "/recommendations",

    icon: Lightbulb,

    permission: PERMISSIONS.RECOMMENDATION_VIEW,
  },
];
