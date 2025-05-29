"use client";
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Ship,
  Settings,
  CalendarDays,
  DollarSign,
  ChevronDown,
  ChevronRight,
  PackagePlus
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AppHeader } from '@/components/layout/AppHeader';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[]; // Roles that can see this item
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'QuotationCreator', 'BookingCreator', 'Reviewer'] },
  { href: '/quotations', label: 'Quotations', icon: FileText, roles: ['Admin', 'QuotationCreator', 'Reviewer'] },
  { href: '/bookings', label: 'Bookings', icon: Ship, roles: ['Admin', 'BookingCreator', 'Reviewer'] },
  {
    href: '#', label: 'Admin', icon: Settings, roles: ['Admin'],
    children: [
      { href: '/admin/schedule', label: 'Manage Schedule', icon: CalendarDays, roles: ['Admin'] },
      { href: '/admin/buy-rates', label: 'Manage Buy Rates', icon: DollarSign, roles: ['Admin'] },
    ],
  },
];

function NavLink({ item, currentPathname }: { item: NavItem; currentPathname: string }) {
  const { open, isMobile } = useSidebar();
  const isActive = item.children ? item.children.some(child => currentPathname.startsWith(child.href)) : currentPathname.startsWith(item.href);

  if (item.children) {
    return (
      <Accordion type="single" collapsible defaultValue={isActive ? "admin-menu" : undefined} className="w-full">
        <AccordionItem value="admin-menu" className="border-none">
          <AccordionTrigger 
            className={cn(
              "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2",
              "hover:no-underline justify-start"
            )}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {(open || isMobile) && <span className="truncate flex-1">{item.label}</span>}
            {/* Chevron is part of AccordionTrigger by default if content is present */}
          </AccordionTrigger>
          <AccordionContent className={cn("pl-4 pr-0 py-0", (open || isMobile) ? "block" : "hidden")}>
            <SidebarMenu className="border-l border-sidebar-border ml-2 pl-2">
              {item.children.map((child) => (
                <SidebarMenuItem key={child.href}>
                   <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm",
                      currentPathname.startsWith(child.href) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    )}
                    asChild
                  >
                    <Link href={child.href} title={child.label}>
                      <child.icon className="h-4 w-4 shrink-0" />
                      {(open || isMobile) && <span className="truncate">{child.label}</span>}
                    </Link>
                  </Button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={{ children: item.label, side: 'right', hidden: open || isMobile }}
      className="justify-start"
    >
      <Link href={item.href}>
        <item.icon />
        {(open || isMobile) && <span>{item.label}</span>}
      </Link>
    </SidebarMenuButton>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { open: sidebarOpen } = useSidebar(); // Get sidebar state

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can show a global loader here if needed
    return <div className="flex h-screen items-center justify-center">Loading application...</div>;
  }

  const filteredNavItems = navItems.filter(item => 
    item.roles ? item.roles.includes(user.role) : true
  ).map(item => ({
    ...item,
    children: item.children?.filter(child => child.roles ? child.roles.includes(user.role) : true)
  }));

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-3">
           <Logo size="md" iconOnly={!sidebarOpen} showText={sidebarOpen} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              item.children && item.children.length === 0 ? null : // Hide admin group if no children visible
              <SidebarMenuItem key={item.href}>
                <NavLink item={item} currentPathname={pathname} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarFooter className="p-3">
          {/* Quick actions if sidebar is open */}
          {sidebarOpen && (
            <div className="space-y-2">
               <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href="/quotations/new"><PackagePlus className="h-4 w-4" /> New Quotation</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href="/bookings/new"><Ship className="h-4 w-4" /> New Booking</Link>
              </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
